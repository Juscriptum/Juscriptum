import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * JWT Auth Guard
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
