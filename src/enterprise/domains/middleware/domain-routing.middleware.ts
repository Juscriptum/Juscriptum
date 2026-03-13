import { Injectable } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { CustomDomainService } from "../services/custom-domain.service";
import { Organization } from "../../../database/entities/Organization.entity";

/**
 * Domain Routing Middleware
 * Routes requests based on custom domain
 */
@Injectable()
export class DomainRoutingMiddleware {
  constructor(private readonly customDomainService: CustomDomainService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const host = req.get("host")?.split(":")[0]; // Remove port

    if (!host) {
      return next();
    }

    // Check if it's a custom domain (not the base domain)
    const baseDomain = process.env.BASE_DOMAIN || "law-organizer.ua";

    if (!host.endsWith(baseDomain)) {
      // This might be a custom domain
      const organization =
        await this.customDomainService.getTenantByDomain(host);

      if (organization) {
        // Attach tenant info to request
        (req as any).tenantFromDomain = organization;
        (req as any).isCustomDomain = true;
      }
    }

    next();
  }
}
