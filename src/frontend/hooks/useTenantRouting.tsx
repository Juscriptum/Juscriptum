/**
 * Tenant-Aware Routing Utilities
 * Provides hooks and components for tenant-based routing in multi-tenant SaaS
 */

import React from "react";
import {
  Navigate,
  useNavigate,
  useParams,
  useLocation,
  generatePath,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";

/**
 * Tenant route parameters
 */
export interface TenantRouteParams {
  tenantId?: string;
  [key: string]: string | undefined;
}

/**
 * Hook to get current tenant ID
 */
export const useTenantId = (): string | null => {
  const tenantId = useSelector((state: RootState) => state.auth.user?.tenantId);
  return tenantId || null;
};

/**
 * Hook to get tenant context
 */
export const useTenantContext = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const organization = useSelector(
    (state: RootState) => state.auth.organization,
  );

  return {
    tenantId: user?.tenantId || null,
    organizationId: organization?.id || null,
    organization,
    user,
    isAuthenticated: !!user,
  };
};

/**
 * Hook for tenant-aware navigation
 */
export const useTenantNavigate = () => {
  const navigate = useNavigate();
  const tenantId = useTenantId();

  /**
   * Navigate to a path, optionally including tenant context
   */
  const tenantNavigate = (
    path: string,
    options?: { replace?: boolean; state?: any },
  ) => {
    navigate(path, options);
  };

  return tenantNavigate;
};

/**
 * Generate tenant-aware path
 */
export const useTenantPath = () => {
  const tenantId = useTenantId();

  /**
   * Generate a path with tenant context if needed
   */
  const generateTenantPath = (
    pattern: string,
    params?: Record<string, string | number>,
  ): string => {
    return generatePath(pattern, params as Record<string, string>);
  };

  return generateTenantPath;
};

/**
 * Props for TenantRoute component
 */
interface TenantRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Tenant Route Component
 * Ensures tenant context is available before rendering children
 */
export const TenantRoute: React.FC<TenantRouteProps> = ({
  children,
  fallback,
}) => {
  const { tenantId, isAuthenticated } = useTenantContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!tenantId) {
    return <>{fallback || <div>Завантаження...</div>}</>;
  }

  return <>{children}</>;
};

/**
 * Props for RequireTenant component
 */
interface RequireTenantProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Require Tenant Component
 * Shows fallback if tenant context is not available
 */
export const RequireTenant: React.FC<RequireTenantProps> = ({
  children,
  fallback,
}) => {
  const tenantId = useTenantId();

  if (!tenantId) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
};

/**
 * Props for TenantLink component
 */
interface TenantLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Tenant Link Component
 * A link that includes tenant context
 */
export const TenantLink: React.FC<TenantLinkProps> = ({
  to,
  children,
  className,
  onClick,
}) => {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
    >
      {children}
    </a>
  );
};

/**
 * Get current tenant from URL or state
 */
export const useCurrentTenant = () => {
  const location = useLocation();
  const params = useParams<TenantRouteParams>();
  const tenantContext = useTenantContext();

  // Try to get tenant ID from URL params first
  const urlTenantId = params.tenantId;

  // Fall back to auth state
  const stateTenantId = tenantContext.tenantId;

  return {
    tenantId: urlTenantId || stateTenantId,
    isFromUrl: !!urlTenantId,
    ...tenantContext,
  };
};

/**
 * Check if user belongs to tenant
 */
export const useTenantMembership = (requiredTenantId?: string): boolean => {
  const userTenantId = useTenantId();

  if (!requiredTenantId) {
    return true;
  }

  return userTenantId === requiredTenantId;
};

/**
 * Route configuration interface
 */
export interface TenantRouteConfig {
  path: string;
  element: React.ReactNode;
  tenantScoped?: boolean;
  roles?: string[];
  features?: string[];
}

/**
 * Create tenant-scoped routes
 */
export const createTenantRoutes = (routes: TenantRouteConfig[]) => {
  return routes.map((route) => ({
    ...route,
    element: route.tenantScoped ? (
      <TenantRoute>{route.element}</TenantRoute>
    ) : (
      route.element
    ),
  }));
};

export default {
  useTenantId,
  useTenantContext,
  useTenantNavigate,
  useTenantPath,
  TenantRoute,
  RequireTenant,
  TenantLink,
  useCurrentTenant,
  useTenantMembership,
  createTenantRoutes,
};
