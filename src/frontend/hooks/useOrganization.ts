import { useState, useEffect, useCallback } from "react";
import { organizationService } from "../services/organization.service";
import {
  Organization,
  UpdateOrganizationData,
} from "../types/organization.types";

/**
 * Use Organization Hook
 */
export const useOrganization = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load organization
   */
  const loadOrganization = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await organizationService.getOrganization();
      setOrganization(data);
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Не вдалося завантажити організацію",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update organization
   */
  const updateOrganization = useCallback(
    async (data: UpdateOrganizationData): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = await organizationService.updateOrganization(data);
        setOrganization(updated);
      } catch (error: any) {
        setError(
          error.response?.data?.message || "Не вдалося оновити організацію",
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Load on first render
   */
  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  return {
    organization,
    isLoading,
    error,
    loadOrganization,
    updateOrganization,
  };
};
