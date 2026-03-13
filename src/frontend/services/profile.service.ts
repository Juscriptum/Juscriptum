import api from "./api";
import { ProfileFormData, UserProfile } from "../types/profile.types";

/**
 * Profile Service
 * Handles profile-related API calls
 */
class ProfileService {
  private baseUrl = "/users";

  /**
   * Get current user's profile
   */
  async getProfile(): Promise<UserProfile> {
    return api.get<UserProfile>(`${this.baseUrl}/profile`);
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: ProfileFormData): Promise<UserProfile> {
    return api.put<UserProfile>(`${this.baseUrl}/profile`, {
      organizationType: data.organizationType,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      middleName: data.middleName.trim() || undefined,
      position: data.position.trim() || undefined,
      taxId: data.taxId.trim() || undefined,
      phonePrimary: data.phonePrimary.trim() || undefined,
      phoneSecondary: data.phoneSecondary,
      emailPrimary: data.emailPrimary.trim().toLowerCase() || undefined,
      emailSecondary: data.emailSecondary,
      legalEntity:
        data.organizationType === "LEGAL_ENTITY"
          ? {
              legalForm: data.legalEntity.legalForm.trim() || undefined,
              legalEntityName:
                data.legalEntity.legalEntityName.trim() || undefined,
              edrpou: data.legalEntity.edrpou.trim() || undefined,
              taxSystem: data.legalEntity.taxSystem,
            }
          : undefined,
      director:
        data.organizationType === "SELF_EMPLOYED"
          ? undefined
          : {
              sameAsUser: data.director.sameAsUser,
              firstName: data.director.firstName.trim() || undefined,
              lastName: data.director.lastName.trim() || undefined,
              middleName: data.director.middleName.trim() || undefined,
              actingBasis: data.director.actingBasis.trim() || undefined,
              position: data.director.position.trim() || undefined,
            },
      legalStatus: data.legalStatus,
      bankName: data.bankName.trim() || undefined,
      bankMfo: data.bankMfo.trim() || undefined,
      iban: data.iban.trim() || undefined,
      taxSystem: data.taxSystem,
      vatPayer: data.vatPayer,
      legalAddress: {
        region: data.legalAddress.region.trim() || undefined,
        city: data.legalAddress.city.trim() || undefined,
        cityCode: data.legalAddress.cityCode.trim() || undefined,
        street: data.legalAddress.street.trim() || undefined,
        building: data.legalAddress.building.trim() || undefined,
        unit: data.legalAddress.unit.trim() || undefined,
      },
      actualSameAsLegal: data.actualSameAsLegal,
      actualAddress: {
        region: data.actualAddress.region.trim() || undefined,
        city: data.actualAddress.city.trim() || undefined,
        cityCode: data.actualAddress.cityCode.trim() || undefined,
        street: data.actualAddress.street.trim() || undefined,
        building: data.actualAddress.building.trim() || undefined,
        unit: data.actualAddress.unit.trim() || undefined,
      },
      additionalAddresses: data.additionalAddresses.map((address) => ({
        region: address.region.trim() || undefined,
        city: address.city.trim() || undefined,
        cityCode: address.cityCode.trim() || undefined,
        street: address.street.trim() || undefined,
        building: address.building.trim() || undefined,
        unit: address.unit.trim() || undefined,
      })),
      certificateNumber: data.certificateNumber.trim() || undefined,
      certificateDate: data.certificateDate || undefined,
      issuedBy: data.issuedBy.trim() || undefined,
      registryNumber: data.registryNumber.trim() || undefined,
      registryDate: data.registryDate || undefined,
      contractNumber: data.contractNumber.trim() || undefined,
      contractWith: data.contractWith.trim() || undefined,
    });
  }

  /**
   * Change password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await api.put(`${this.baseUrl}/profile/password`, {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<{ url: string }>(
      `${this.baseUrl}/profile/avatar`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response;
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(): Promise<void> {
    await api.delete(`${this.baseUrl}/profile/avatar`);
  }
}

export const profileService = new ProfileService();
