export interface PlatformAdminJwtPayload {
  admin_id: string;
  scope: "platform_admin";
  token_type: "access";
  role: string;
  permissions: string[];
  email: string;
  mfa_level: "password" | "mfa";
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface PlatformAdminRefreshTokenPayload {
  admin_id: string;
  scope: "platform_admin";
  token_type: "refresh";
  token_id: string;
  device_id: string;
  iat?: number;
  exp?: number;
}

export interface PlatformAdminMfaTokenPayload {
  admin_id: string;
  scope: "platform_admin";
  token_type: "mfa";
  email: string;
  iat?: number;
  exp?: number;
}
