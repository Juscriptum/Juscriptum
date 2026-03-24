"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrganizationService", {
    enumerable: true,
    get: function() {
        return OrganizationService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _Organizationentity = require("../../database/entities/Organization.entity");
const _Subscriptionentity = require("../../database/entities/Subscription.entity");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _OnboardingProgressentity = require("../../database/entities/OnboardingProgress.entity");
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
let OrganizationService = class OrganizationService {
    /**
   * Get organization by ID
   */ async getOrganizationById(tenantId) {
        const organization = await this.organizationRepository.findOne({
            where: {
                id: tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!organization) {
            throw new _common.NotFoundException("Організацію не знайдено");
        }
        return organization;
    }
    /**
   * Update organization
   */ async updateOrganization(tenantId, data) {
        const organization = await this.getOrganizationById(tenantId);
        Object.assign(organization, data);
        await this.organizationRepository.save(organization);
        return this.getOrganizationById(tenantId);
    }
    /**
   * Delete organization (soft delete)
   */ async deleteOrganization(tenantId) {
        await this.organizationRepository.update({
            id: tenantId
        }, {
            deletedAt: new Date()
        });
    }
    /**
   * Get onboarding progress
   */ async getOnboardingProgress(tenantId, userId) {
        const progress = await this.onboardingProgressRepository.find({
            where: {
                tenantId,
                userId
            },
            order: {
                step: "ASC"
            }
        });
        const completedSteps = progress.filter((p)=>p.completed);
        const percentage = progress.length > 0 ? Math.round(completedSteps.length / progress.length * 100) : 0;
        return {
            completed: percentage === 100,
            percentage,
            steps: progress.map((p)=>({
                    step: p.step,
                    completed: p.completed,
                    completedAt: p.completedAt
                }))
        };
    }
    /**
   * Update onboarding step
   */ async updateOnboardingStep(tenantId, userId, step, completed, data = {}) {
        const existingProgress = await this.onboardingProgressRepository.findOne({
            where: {
                tenantId,
                userId,
                step: step
            }
        });
        if (existingProgress) {
            await this.onboardingProgressRepository.update({
                id: existingProgress.id
            }, {
                completed,
                completedAt: completed ? new Date() : undefined,
                data: {
                    ...existingProgress.data,
                    ...data
                }
            });
        } else {
            await this.onboardingProgressRepository.save({
                tenantId,
                userId,
                step: step,
                completed,
                completedAt: completed ? new Date() : undefined,
                data,
                percentage: completed ? 100 : 0
            });
        }
    }
    /**
   * Get subscription status
   */ async getSubscriptionStatus(tenantId) {
        const subscription = await this.subscriptionRepository.findOne({
            where: {
                tenantId
            }
        });
        if (!subscription) {
            throw new _common.NotFoundException("Підписку не знайдено");
        }
        return subscription;
    }
    /**
   * Check subscription status
   */ async isSubscriptionActive(tenantId) {
        const organization = await this.organizationRepository.findOne({
            where: {
                id: tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!organization) {
            return false;
        }
        // Check if trial is active
        if (organization.subscriptionStatus === _subscriptionenum.SubscriptionStatus.TRIALING && organization.trialEndAt && organization.trialEndAt > new Date()) {
            return true;
        }
        // Check if subscription is active
        return organization.subscriptionStatus === _subscriptionenum.SubscriptionStatus.ACTIVE;
    }
    /**
   * Check if user can access feature based on subscription plan
   */ async canAccessFeature(tenantId, requiredPlan) {
        const organization = await this.organizationRepository.findOne({
            where: {
                id: tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!organization) {
            return false;
        }
        const planLevels = {
            [_subscriptionenum.SubscriptionPlan.BASIC]: 1,
            [_subscriptionenum.SubscriptionPlan.PROFESSIONAL]: 2,
            [_subscriptionenum.SubscriptionPlan.ENTERPRISE]: 3
        };
        const currentLevel = planLevels[organization.subscriptionPlan];
        const requiredLevel = planLevels[requiredPlan];
        return currentLevel >= requiredLevel;
    }
    constructor(organizationRepository, subscriptionRepository, onboardingProgressRepository){
        this.organizationRepository = organizationRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.onboardingProgressRepository = onboardingProgressRepository;
    }
};
OrganizationService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Organizationentity.Organization)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Subscriptionentity.Subscription)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_OnboardingProgressentity.OnboardingProgress)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], OrganizationService);

//# sourceMappingURL=organization.service.js.map