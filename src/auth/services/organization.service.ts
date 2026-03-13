import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { Organization } from "../../database/entities/Organization.entity";
import { Subscription } from "../../database/entities/Subscription.entity";
import { SubscriptionStatus } from "../../database/entities/enums/subscription.enum";
import { SubscriptionPlan } from "../../database/entities/enums/subscription.enum";
import { OnboardingProgress } from "../../database/entities/OnboardingProgress.entity";

/**
 * Organization Service
 */
@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(OnboardingProgress)
    private readonly onboardingProgressRepository: Repository<OnboardingProgress>,
  ) {}

  /**
   * Get organization by ID
   */
  async getOrganizationById(tenantId: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id: tenantId, deletedAt: IsNull() },
    });

    if (!organization) {
      throw new NotFoundException("Організацію не знайдено");
    }

    return organization;
  }

  /**
   * Update organization
   */
  async updateOrganization(
    tenantId: string,
    data: Partial<Organization>,
  ): Promise<Organization> {
    const organization = await this.getOrganizationById(tenantId);
    Object.assign(organization, data);
    await this.organizationRepository.save(organization);

    return this.getOrganizationById(tenantId);
  }

  /**
   * Delete organization (soft delete)
   */
  async deleteOrganization(tenantId: string): Promise<void> {
    await this.organizationRepository.update(
      { id: tenantId },
      { deletedAt: new Date() },
    );
  }

  /**
   * Get onboarding progress
   */
  async getOnboardingProgress(
    tenantId: string,
    userId: string,
  ): Promise<{
    completed: boolean;
    percentage: number;
    steps: any[];
  }> {
    const progress = await this.onboardingProgressRepository.find({
      where: { tenantId, userId },
      order: { step: "ASC" },
    });

    const completedSteps = progress.filter((p) => p.completed);
    const percentage =
      progress.length > 0
        ? Math.round((completedSteps.length / progress.length) * 100)
        : 0;

    return {
      completed: percentage === 100,
      percentage,
      steps: progress.map((p) => ({
        step: p.step,
        completed: p.completed,
        completedAt: p.completedAt,
      })),
    };
  }

  /**
   * Update onboarding step
   */
  async updateOnboardingStep(
    tenantId: string,
    userId: string,
    step: string,
    completed: boolean,
    data: Record<string, any> = {},
  ): Promise<void> {
    const existingProgress = await this.onboardingProgressRepository.findOne({
      where: { tenantId, userId, step: step as any },
    });

    if (existingProgress) {
      await this.onboardingProgressRepository.update(
        { id: existingProgress.id },
        {
          completed,
          completedAt: completed ? new Date() : undefined,
          data: { ...existingProgress.data, ...data },
        },
      );
    } else {
      await this.onboardingProgressRepository.save({
        tenantId,
        userId,
        step: step as any,
        completed,
        completedAt: completed ? new Date() : undefined,
        data,
        percentage: completed ? 100 : 0,
      });
    }
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(tenantId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId },
    });

    if (!subscription) {
      throw new NotFoundException("Підписку не знайдено");
    }

    return subscription;
  }

  /**
   * Check subscription status
   */
  async isSubscriptionActive(tenantId: string): Promise<boolean> {
    const organization = await this.organizationRepository.findOne({
      where: { id: tenantId, deletedAt: IsNull() },
    });

    if (!organization) {
      return false;
    }

    // Check if trial is active
    if (
      organization.subscriptionStatus === SubscriptionStatus.TRIALING &&
      organization.trialEndAt &&
      organization.trialEndAt > new Date()
    ) {
      return true;
    }

    // Check if subscription is active
    return organization.subscriptionStatus === SubscriptionStatus.ACTIVE;
  }

  /**
   * Check if user can access feature based on subscription plan
   */
  async canAccessFeature(
    tenantId: string,
    requiredPlan: SubscriptionPlan,
  ): Promise<boolean> {
    const organization = await this.organizationRepository.findOne({
      where: { id: tenantId, deletedAt: IsNull() },
    });

    if (!organization) {
      return false;
    }

    const planLevels = {
      [SubscriptionPlan.BASIC]: 1,
      [SubscriptionPlan.PROFESSIONAL]: 2,
      [SubscriptionPlan.ENTERPRISE]: 3,
    };

    const currentLevel = planLevels[organization.subscriptionPlan];
    const requiredLevel = planLevels[requiredPlan];

    return currentLevel >= requiredLevel;
  }
}
