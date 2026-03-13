import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { TenantDatabaseService } from "../services/tenant-database.service";
import { JwtPayload } from "../../../auth/interfaces/jwt.interface";

/**
 * Database Routing Middleware
 * Routes requests to appropriate tenant database
 */
@Injectable()
export class DatabaseRoutingMiddleware implements NestMiddleware {
  constructor(private readonly tenantDatabaseService: TenantDatabaseService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as JwtPayload;

    if (!user?.tenant_id) {
      return next();
    }

    try {
      // Get appropriate database connection for tenant
      const dataSource = await this.tenantDatabaseService.getConnection(
        user.tenant_id,
      );

      // Attach connection to request for use in services
      (req as any).tenantDataSource = dataSource;

      next();
    } catch (error) {
      throw new UnauthorizedException("Unable to connect to tenant database");
    }
  }
}
