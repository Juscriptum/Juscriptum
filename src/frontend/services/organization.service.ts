import api from "./api";
import {
  Organization,
  UpdateOrganizationData,
  OrganizationSubscription,
  OnboardingProgress,
  RegistryImportStateSummary,
} from "../types/organization.types";

/**
 * Organization Service
 */
export const organizationService = {
  /**
   * Get current organization
   */
  async getOrganization(): Promise<Organization> {
    return api.get<Organization>("/organizations/me");
  },

  /**
   * Update organization
   */
  async updateOrganization(
    data: UpdateOrganizationData,
  ): Promise<Organization> {
    return api.put<Organization>("/organizations/me", data);
  },

  /**
   * Get subscription status
   */
  async getSubscription(): Promise<OrganizationSubscription> {
    return api.get<OrganizationSubscription>("/organizations/subscription");
  },

  /**
   * Get onboarding progress
   */
  async getOnboardingProgress(): Promise<OnboardingProgress> {
    return api.get<OnboardingProgress>("/organizations/onboarding");
  },

  /**
   * Get registry dataset/import metadata for settings
   */
  async getRegistryImports(): Promise<RegistryImportStateSummary[]> {
    return api.get<RegistryImportStateSummary[]>(
      "/organizations/me/registry-imports",
    );
  },

  /**
   * Update onboarding step
   */
  async updateOnboardingStep(
    step: string,
    completed: boolean,
    data?: Record<string, any>,
  ): Promise<void> {
    await api.patch<void>(`/organizations/onboarding/${step}`, {
      completed,
      data,
    });
  },
};
