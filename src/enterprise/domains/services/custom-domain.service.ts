import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as dns from "dns";
import { promisify } from "util";
import { CustomDomain } from "../entities/CustomDomain.entity";
import { Organization } from "../../../database/entities/Organization.entity";
import { SubscriptionPlan } from "../../../database/entities/enums/subscription.enum";
import {
  CustomDomainConfig,
  DnsRecord,
  DomainVerificationResult,
  DNS_VERIFICATION_PREFIX,
} from "../interfaces/custom-domain.interface";

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

/**
 * Custom Domain Service
 * Manages custom domains for Enterprise tenants
 */
@Injectable()
export class CustomDomainService {
  private readonly logger = new Logger(CustomDomainService.name);
  private readonly baseDomain: string;

  constructor(
    @InjectRepository(CustomDomain)
    private readonly domainRepository: Repository<CustomDomain>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly configService: ConfigService,
  ) {
    this.baseDomain = this.configService.get("BASE_DOMAIN", "law-organizer.ua");
  }

  /**
   * Add custom domain for tenant
   */
  async addDomain(tenantId: string, domain: string): Promise<CustomDomain> {
    // Verify tenant has Enterprise plan
    await this.verifyEnterprisePlan(tenantId);

    // Check domain doesn't already exist
    const existing = await this.domainRepository.findOne({
      where: { domain: domain.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestException("Domain already registered");
    }

    // Generate verification token
    const verificationToken = this.generateVerificationToken();

    // Create DNS records for verification
    const dnsRecords: DnsRecord[] = [
      {
        type: "TXT",
        name: `${DNS_VERIFICATION_PREFIX}.${domain}`,
        value: verificationToken,
        verified: false,
      },
      {
        type: "CNAME",
        name: domain,
        value: `tenant.${this.baseDomain}`,
        verified: false,
      },
    ];

    const customDomain = this.domainRepository.create({
      tenantId,
      domain: domain.toLowerCase(),
      isVerified: false,
      isPrimary: false,
      dnsRecords,
      verificationToken,
    });

    return this.domainRepository.save(customDomain);
  }

  /**
   * Verify domain ownership via DNS
   */
  async verifyDomain(
    tenantId: string,
    domainId: string,
  ): Promise<DomainVerificationResult> {
    const customDomain = await this.domainRepository.findOne({
      where: { id: domainId, tenantId },
    });

    if (!customDomain) {
      throw new NotFoundException("Domain not found");
    }

    const errors: string[] = [];
    const dnsRecords = [...customDomain.dnsRecords];

    // Verify TXT record for ownership
    try {
      const txtRecords = await resolveTxt(
        `${DNS_VERIFICATION_PREFIX}.${customDomain.domain}`,
      );
      const flattened = txtRecords.flat();

      if (flattened.includes(customDomain.verificationToken)) {
        const txtIndex = dnsRecords.findIndex((r) => r.type === "TXT");
        if (txtIndex >= 0) {
          dnsRecords[txtIndex].verified = true;
        }
      } else {
        errors.push("TXT verification record not found or incorrect");
      }
    } catch (error) {
      errors.push("Unable to verify TXT record");
    }

    // Verify CNAME record
    try {
      const cnameRecords = await resolveCname(customDomain.domain);
      const expectedCname = `tenant.${this.baseDomain}`;

      if (cnameRecords.some((r) => r.includes(this.baseDomain))) {
        const cnameIndex = dnsRecords.findIndex((r) => r.type === "CNAME");
        if (cnameIndex >= 0) {
          dnsRecords[cnameIndex].verified = true;
        }
      } else {
        errors.push(`CNAME record should point to ${expectedCname}`);
      }
    } catch (error) {
      errors.push("Unable to verify CNAME record");
    }

    // Update domain status
    const allVerified = dnsRecords.every((r) => r.verified);

    customDomain.dnsRecords = dnsRecords;
    customDomain.isVerified = allVerified;
    if (allVerified) {
      customDomain.verifiedAt = new Date();
    }

    await this.domainRepository.save(customDomain);

    // If verified, update organization's custom domain
    if (allVerified) {
      await this.organizationRepository.update(
        { id: tenantId },
        { customDomain: customDomain.domain },
      );

      this.logger.log(
        `Domain verified: ${customDomain.domain} for tenant ${tenantId}`,
      );
    }

    return {
      success: allVerified,
      domain: customDomain.domain,
      dnsRecords,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Set domain as primary
   */
  async setPrimaryDomain(
    tenantId: string,
    domainId: string,
  ): Promise<CustomDomain> {
    const customDomain = await this.domainRepository.findOne({
      where: { id: domainId, tenantId, isVerified: true },
    });

    if (!customDomain) {
      throw new NotFoundException("Verified domain not found");
    }

    // Unset current primary
    await this.domainRepository.update(
      { tenantId, isPrimary: true },
      { isPrimary: false },
    );

    // Set new primary
    customDomain.isPrimary = true;
    await this.domainRepository.save(customDomain);

    return customDomain;
  }

  /**
   * Remove custom domain
   */
  async removeDomain(tenantId: string, domainId: string): Promise<void> {
    const customDomain = await this.domainRepository.findOne({
      where: { id: domainId, tenantId },
    });

    if (!customDomain) {
      throw new NotFoundException("Domain not found");
    }

    await this.domainRepository.remove(customDomain);

    // Update organization if primary domain was removed
    if (customDomain.isPrimary) {
      await this.organizationRepository.update(
        { id: tenantId },
        { customDomain: undefined },
      );
    }
  }

  /**
   * Get all domains for tenant
   */
  async getDomains(tenantId: string): Promise<CustomDomain[]> {
    return this.domainRepository.find({
      where: { tenantId },
      order: { isPrimary: "DESC", createdAt: "DESC" },
    });
  }

  /**
   * Get domain by ID
   */
  async getDomain(tenantId: string, domainId: string): Promise<CustomDomain> {
    const domain = await this.domainRepository.findOne({
      where: { id: domainId, tenantId },
    });

    if (!domain) {
      throw new NotFoundException("Domain not found");
    }

    return domain;
  }

  /**
   * Generate SSL certificate for domain (using Let's Encrypt or similar)
   */
  async generateSslCertificate(
    tenantId: string,
    domainId: string,
  ): Promise<CustomDomain> {
    const customDomain = await this.domainRepository.findOne({
      where: { id: domainId, tenantId, isVerified: true },
    });

    if (!customDomain) {
      throw new NotFoundException("Verified domain not found");
    }

    // In production, integrate with Let's Encrypt via ACME
    // This is a placeholder for the SSL generation logic
    this.logger.log(
      `SSL certificate generation initiated for ${customDomain.domain}`,
    );

    // Mark SSL as enabled (in production, actual cert would be stored)
    customDomain.sslEnabled = true;
    customDomain.sslExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    return this.domainRepository.save(customDomain);
  }

  /**
   * Get tenant by domain (for request routing)
   */
  async getTenantByDomain(domain: string): Promise<Organization | null> {
    const customDomain = await this.domainRepository.findOne({
      where: { domain: domain.toLowerCase(), isVerified: true },
      relations: ["organization"],
    });

    return customDomain?.organization || null;
  }

  /**
   * Verify tenant has Enterprise plan
   */
  private async verifyEnterprisePlan(tenantId: string): Promise<void> {
    const organization = await this.organizationRepository.findOne({
      where: { id: tenantId },
      select: ["subscriptionPlan"],
    });

    if (
      !organization ||
      organization.subscriptionPlan !== SubscriptionPlan.ENTERPRISE
    ) {
      throw new BadRequestException(
        "Custom domains require Enterprise subscription",
      );
    }
  }

  /**
   * Generate verification token
   */
  private generateVerificationToken(): string {
    const crypto = require("crypto");
    return `law-organizer-verify=${crypto.randomBytes(32).toString("hex")}`;
  }
}
