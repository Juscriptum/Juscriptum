import { useState, useEffect, useCallback } from "react";
import { organizationService } from "../services/organization.service";
import { OnboardingProgress } from "../types/organization.types";

/**
 * Use Onboarding Hook
 */
export const useOnboarding = () => {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load progress
   */
  const loadProgress = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await organizationService.getOnboardingProgress();
      setProgress(data);
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Не вдалося завантажити прогрес",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Complete step
   */
  const completeStep = useCallback(
    async (step: string, data?: Record<string, any>): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await organizationService.updateOnboardingStep(step, true, data);
        await loadProgress();
      } catch (error: any) {
        setError(error.response?.data?.message || "Не вдалося оновити крок");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [loadProgress],
  );

  /**
   * Check if step is completed
   */
  const isStepCompleted = useCallback(
    (step: string): boolean => {
      return (
        progress?.steps.some((s) => s.step === step && s.completed) || false
      );
    },
    [progress],
  );

  /**
   * Load on first render
   */
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    isLoading,
    error,
    loadProgress,
    completeStep,
    isStepCompleted,
    isCompleted: progress?.completed || false,
    percentage: progress?.percentage || 0,
  };
};
