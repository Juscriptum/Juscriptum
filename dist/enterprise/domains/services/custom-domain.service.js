"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CustomDomainService", {
    enumerable: true,
    get: function() {
        return CustomDomainService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _config = require("@nestjs/config");
const _dns = /*#__PURE__*/ _interop_require_wildcard(require("dns"));
const _util = require("util");
const _CustomDomainentity = require("../entities/CustomDomain.entity");
const _Organizationentity = require("../../../database/entities/Organization.entity");
const _subscriptionenum = require("../../../database/entities/enums/subscription.enum");
const _customdomaininterface = require("../interfaces/custom-domain.interface");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const resolveTxt = (0, _util.promisify)(_dns.resolveTxt);
const resolveCname = (0, _util.promisify)(_dns.resolveCname);
let CustomDomainService = class CustomDomainService {
    /**
   * Add custom domain for tenant
   */ async addDomain(tenantId, domain) {
        // Verify tenant has Enterprise plan
        await this.verifyEnterprisePlan(tenantId);
        // Check domain doesn't already exist
        const existing = await this.domainRepository.findOne({
            where: {
                domain: domain.toLowerCase()
            }
        });
        if (existing) {
            throw new _common.BadRequestException("Domain already registered");
        }
        // Generate verification token
        const verificationToken = this.generateVerificationToken();
        // Create DNS records for verification
        const dnsRecords = [
            {
                type: "TXT",
                name: `${_customdomaininterface.DNS_VERIFICATION_PREFIX}.${domain}`,
                value: verificationToken,
                verified: false
            },
            {
                type: "CNAME",
                name: domain,
                value: `tenant.${this.baseDomain}`,
                verified: false
            }
        ];
        const customDomain = this.domainRepository.create({
            tenantId,
            domain: domain.toLowerCase(),
            isVerified: false,
            isPrimary: false,
            dnsRecords,
            verificationToken
        });
        return this.domainRepository.save(customDomain);
    }
    /**
   * Verify domain ownership via DNS
   */ async verifyDomain(tenantId, domainId) {
        const customDomain = await this.domainRepository.findOne({
            where: {
                id: domainId,
                tenantId
            }
        });
        if (!customDomain) {
            throw new _common.NotFoundException("Domain not found");
        }
        const errors = [];
        const dnsRecords = [
            ...customDomain.dnsRecords
        ];
        // Verify TXT record for ownership
        try {
            const txtRecords = await resolveTxt(`${_customdomaininterface.DNS_VERIFICATION_PREFIX}.${customDomain.domain}`);
            const flattened = txtRecords.flat();
            if (flattened.includes(customDomain.verificationToken)) {
                const txtIndex = dnsRecords.findIndex((r)=>r.type === "TXT");
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
            if (cnameRecords.some((r)=>r.includes(this.baseDomain))) {
                const cnameIndex = dnsRecords.findIndex((r)=>r.type === "CNAME");
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
        const allVerified = dnsRecords.every((r)=>r.verified);
        customDomain.dnsRecords = dnsRecords;
        customDomain.isVerified = allVerified;
        if (allVerified) {
            customDomain.verifiedAt = new Date();
        }
        await this.domainRepository.save(customDomain);
        // If verified, update organization's custom domain
        if (allVerified) {
            await this.organizationRepository.update({
                id: tenantId
            }, {
                customDomain: customDomain.domain
            });
            this.logger.log(`Domain verified: ${customDomain.domain} for tenant ${tenantId}`);
        }
        return {
            success: allVerified,
            domain: customDomain.domain,
            dnsRecords,
            errors: errors.length > 0 ? errors : undefined
        };
    }
    /**
   * Set domain as primary
   */ async setPrimaryDomain(tenantId, domainId) {
        const customDomain = await this.domainRepository.findOne({
            where: {
                id: domainId,
                tenantId,
                isVerified: true
            }
        });
        if (!customDomain) {
            throw new _common.NotFoundException("Verified domain not found");
        }
        // Unset current primary
        await this.domainRepository.update({
            tenantId,
            isPrimary: true
        }, {
            isPrimary: false
        });
        // Set new primary
        customDomain.isPrimary = true;
        await this.domainRepository.save(customDomain);
        return customDomain;
    }
    /**
   * Remove custom domain
   */ async removeDomain(tenantId, domainId) {
        const customDomain = await this.domainRepository.findOne({
            where: {
                id: domainId,
                tenantId
            }
        });
        if (!customDomain) {
            throw new _common.NotFoundException("Domain not found");
        }
        await this.domainRepository.remove(customDomain);
        // Update organization if primary domain was removed
        if (customDomain.isPrimary) {
            await this.organizationRepository.update({
                id: tenantId
            }, {
                customDomain: undefined
            });
        }
    }
    /**
   * Get all domains for tenant
   */ async getDomains(tenantId) {
        return this.domainRepository.find({
            where: {
                tenantId
            },
            order: {
                isPrimary: "DESC",
                createdAt: "DESC"
            }
        });
    }
    /**
   * Get domain by ID
   */ async getDomain(tenantId, domainId) {
        const domain = await this.domainRepository.findOne({
            where: {
                id: domainId,
                tenantId
            }
        });
        if (!domain) {
            throw new _common.NotFoundException("Domain not found");
        }
        return domain;
    }
    /**
   * Generate SSL certificate for domain (using Let's Encrypt or similar)
   */ async generateSslCertificate(tenantId, domainId) {
        const customDomain = await this.domainRepository.findOne({
            where: {
                id: domainId,
                tenantId,
                isVerified: true
            }
        });
        if (!customDomain) {
            throw new _common.NotFoundException("Verified domain not found");
        }
        // In production, integrate with Let's Encrypt via ACME
        // This is a placeholder for the SSL generation logic
        this.logger.log(`SSL certificate generation initiated for ${customDomain.domain}`);
        // Mark SSL as enabled (in production, actual cert would be stored)
        customDomain.sslEnabled = true;
        customDomain.sslExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
        return this.domainRepository.save(customDomain);
    }
    /**
   * Get tenant by domain (for request routing)
   */ async getTenantByDomain(domain) {
        const customDomain = await this.domainRepository.findOne({
            where: {
                domain: domain.toLowerCase(),
                isVerified: true
            },
            relations: [
                "organization"
            ]
        });
        return customDomain?.organization || null;
    }
    /**
   * Verify tenant has Enterprise plan
   */ async verifyEnterprisePlan(tenantId) {
        const organization = await this.organizationRepository.findOne({
            where: {
                id: tenantId
            },
            select: [
                "subscriptionPlan"
            ]
        });
        if (!organization || organization.subscriptionPlan !== _subscriptionenum.SubscriptionPlan.ENTERPRISE) {
            throw new _common.BadRequestException("Custom domains require Enterprise subscription");
        }
    }
    /**
   * Generate verification token
   */ generateVerificationToken() {
        const crypto = require("crypto");
        return `law-organizer-verify=${crypto.randomBytes(32).toString("hex")}`;
    }
    constructor(domainRepository, organizationRepository, configService){
        this.domainRepository = domainRepository;
        this.organizationRepository = organizationRepository;
        this.configService = configService;
        this.logger = new _common.Logger(CustomDomainService.name);
        this.baseDomain = this.configService.get("BASE_DOMAIN", "law-organizer.ua");
    }
};
CustomDomainService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_CustomDomainentity.CustomDomain)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Organizationentity.Organization)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], CustomDomainService);

//# sourceMappingURL=custom-domain.service.js.map