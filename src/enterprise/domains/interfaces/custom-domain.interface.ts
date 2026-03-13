/**
 * Custom Domain Configuration
 */

export interface CustomDomainConfig {
  id: string;
  tenantId: string;
  domain: string;
  isVerified: boolean;
  isPrimary: boolean;
  sslEnabled: boolean;
  sslCertificate?: string;
  sslPrivateKey?: string;
  sslExpiresAt?: Date;
  dnsRecords: DnsRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DnsRecord {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
  verified: boolean;
}

export interface DomainVerificationResult {
  success: boolean;
  domain: string;
  dnsRecords: DnsRecord[];
  errors?: string[];
}

export const DNS_VERIFICATION_PREFIX = "_law-organizer-verification";
export const DOMAIN_NOT_FOUND = "DOMAIN_NOT_FOUND";
export const DOMAIN_NOT_VERIFIED = "DOMAIN_NOT_VERIFIED";
