import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User, Organization } from "../types/auth.types";

/**
 * Tenant context state
 */
interface TenantState {
  tenantId: string | null;
  organization: Organization | null;
  currentUser: User | null;
  members: User[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial state
 */
const initialState: TenantState = {
  tenantId: null,
  organization: null,
  currentUser: null,
  members: [],
  isLoading: false,
  error: null,
};

/**
 * Tenant Slice
 */
const tenantSlice = createSlice({
  name: "tenant",
  initialState,
  reducers: {
    /**
     * Set tenant context
     */
    setTenantContext: (
      state,
      action: PayloadAction<{
        tenantId: string;
        organization: Organization;
        currentUser: User;
      }>,
    ) => {
      state.tenantId = action.payload.tenantId;
      state.organization = action.payload.organization;
      state.currentUser = action.payload.currentUser;
      state.isLoading = false;
      state.error = null;
    },

    /**
     * Set organization
     */
    setOrganization: (state, action: PayloadAction<Organization>) => {
      state.organization = action.payload;
    },

    /**
     * Update organization (partial update)
     */
    updateOrganization: (
      state,
      action: PayloadAction<Partial<Organization>>,
    ) => {
      if (state.organization) {
        state.organization = { ...state.organization, ...action.payload };
      }
    },

    /**
     * Set current user
     */
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },

    /**
     * Update current user (partial update)
     */
    updateCurrentUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },

    /**
     * Set organization members
     */
    setMembers: (state, action: PayloadAction<User[]>) => {
      state.members = action.payload;
    },

    /**
     * Add member
     */
    addMember: (state, action: PayloadAction<User>) => {
      state.members.push(action.payload);
    },

    /**
     * Update member
     */
    updateMember: (
      state,
      action: PayloadAction<{ id: string; data: Partial<User> }>,
    ) => {
      const index = state.members.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.members[index] = {
          ...state.members[index],
          ...action.payload.data,
        };
      }
    },

    /**
     * Remove member
     */
    removeMember: (state, action: PayloadAction<string>) => {
      state.members = state.members.filter((m) => m.id !== action.payload);
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Set error state
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Clear tenant context (on logout)
     */
    clearTenantContext: (state) => {
      state.tenantId = null;
      state.organization = null;
      state.currentUser = null;
      state.members = [];
      state.isLoading = false;
      state.error = null;
    },
  },
});

/**
 * Exported actions
 */
export const {
  setTenantContext,
  setOrganization,
  updateOrganization,
  setCurrentUser,
  updateCurrentUser,
  setMembers,
  addMember,
  updateMember,
  removeMember,
  setLoading,
  setError,
  clearTenantContext,
} = tenantSlice.actions;

/**
 * Selector hooks
 */
export const selectTenantId = (state: { tenant: TenantState }) =>
  state.tenant.tenantId;
export const selectOrganization = (state: { tenant: TenantState }) =>
  state.tenant.organization;
export const selectCurrentUser = (state: { tenant: TenantState }) =>
  state.tenant.currentUser;
export const selectMembers = (state: { tenant: TenantState }) =>
  state.tenant.members;
export const selectIsLoading = (state: { tenant: TenantState }) =>
  state.tenant.isLoading;
export const selectError = (state: { tenant: TenantState }) =>
  state.tenant.error;

/**
 * Select organization subscription plan
 */
export const selectSubscriptionPlan = (state: { tenant: TenantState }) =>
  state.tenant.organization?.subscriptionPlan || null;

/**
 * Select organization subscription status
 */
export const selectSubscriptionStatus = (state: { tenant: TenantState }) =>
  state.tenant.organization?.subscriptionStatus || null;

/**
 * Check if user has role
 */
export const selectHasRole =
  (roles: string[]) =>
  (state: { tenant: TenantState }): boolean => {
    const user = state.tenant.currentUser;
    if (!user) return false;
    return roles.includes(user.role);
  };

/**
 * Check if user is owner
 */
export const selectIsOwner = (state: { tenant: TenantState }): boolean => {
  return state.tenant.currentUser?.role === "organization_owner";
};

/**
 * Check if user is admin
 */
export const selectIsAdmin = (state: { tenant: TenantState }): boolean => {
  const role = state.tenant.currentUser?.role;
  return role === "organization_owner" || role === "organization_admin";
};

export default tenantSlice.reducer;
