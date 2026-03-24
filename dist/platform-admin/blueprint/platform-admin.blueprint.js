"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PLATFORM_ADMIN_BLUEPRINT", {
    enumerable: true,
    get: function() {
        return PLATFORM_ADMIN_BLUEPRINT;
    }
});
const PLATFORM_ADMIN_BLUEPRINT = {
    updatedAt: "2026-03-22",
    frontendEntry: "/platform-admin.html",
    backendPrefix: "/v1/platform-admin",
    backendModuleRoot: "src/platform-admin",
    frontendModuleRoot: "src/frontend/platform-admin",
    principles: [
        "Keep platform-admin outside the tenant CRM navigation and layout.",
        "Return tenant metadata, health, billing, and audit state by default, not client content.",
        "Treat every platform-admin mutation as a high-trust action with an explicit reason.",
        "Use dedicated platform-admin identities instead of reusing tenant users."
    ],
    disabledCapabilities: [
        "No client, case, note, or document content access in MVP.",
        "No hidden impersonation or silent tenant session takeover.",
        "No cross-tenant lookup by client email, phone, tax ID, or EDRPOU.",
        "No raw callback payload, token, or secret exposure in admin responses."
    ],
    temporaryConstraints: [
        "Dedicated PlatformAdminUser bootstrap, login, MFA enrollment, and metadata-only dashboard/organization read models now exist, but platform-admin audit tables and approval workflows are still incomplete.",
        "Current PostgreSQL RLS remains tenant-scoped. The local read-model layer is allow-listed, but production-like platform-admin reads still need a dedicated privileged PostgreSQL path or explicit admin views/procedures."
    ],
    securityDecisions: [
        {
            id: "separate-entry",
            title: "Separate frontend entry",
            decision: "Expose platform-admin as a distinct HTML entry and layout instead of linking it from the tenant SPA.",
            rationale: "This keeps the owner back office out of the user navigation surface and avoids accidental reuse of tenant-only UX assumptions.",
            status: "locked_for_mvp"
        },
        {
            id: "separate-auth",
            title: "Dedicated platform-admin auth",
            decision: "Introduce PlatformAdminUser and PlatformAdminSession instead of modeling the portal owner as another organization member.",
            rationale: "The current auth and RLS model expects tenant-bound identities and should not become the source of truth for portal-owner access.",
            status: "locked_for_mvp"
        },
        {
            id: "metadata-first",
            title: "Metadata-first access model",
            decision: "Platform-admin screens must default to organization metadata, security posture, and operational diagnostics.",
            rationale: "This is the safest way to support billing and support workflows without exposing attorney-client data by default.",
            status: "locked_for_mvp"
        },
        {
            id: "break-glass",
            title: "Break-glass access deferred",
            decision: "Any temporary read access to tenant content requires a separate Phase 2 workflow with approval, TTL, and full audit.",
            rationale: "Support convenience is not enough to justify direct access to privileged legal data in MVP.",
            status: "phase_2"
        }
    ],
    screens: [
        {
            id: "login",
            phase: "mvp",
            title: "Platform Admin Login",
            route: "/login",
            purpose: "Dedicated owner/admin sign-in with one-time bootstrap for the first operator, MFA verification, and required MFA setup.",
            sections: [
                "First owner bootstrap",
                "Primary credential form",
                "MFA verification",
                "MFA enrollment and backup codes"
            ]
        },
        {
            id: "dashboard",
            phase: "mvp",
            title: "Dashboard",
            route: "/dashboard",
            purpose: "Platform-wide health summary across organizations, billing, security, and worker alerts.",
            sections: [
                "Organization KPIs",
                "Billing anomalies",
                "Security alerts",
                "Worker backlog"
            ]
        },
        {
            id: "organizations",
            phase: "mvp",
            title: "Organizations Registry",
            route: "/organizations",
            purpose: "Search and filter tenant accounts by status, plan, activity, and risk without exposing client data.",
            sections: [
                "Search and filters",
                "Plan and status badges",
                "Owner and usage summary",
                "Risk flags"
            ]
        },
        {
            id: "organization-detail",
            phase: "mvp",
            title: "Organization Detail",
            route: "/organizations/:id",
            purpose: "Single-tenant back-office view for support, billing, security, and operational review.",
            sections: [
                "Overview",
                "Users",
                "Billing",
                "Security",
                "Ops",
                "Audit"
            ]
        },
        {
            id: "ops",
            phase: "mvp",
            title: "Operations",
            route: "/ops",
            purpose: "Review readiness, providers, worker backlog, and high-signal platform incidents.",
            sections: [
                "Platform readiness",
                "Redis and database health",
                "Provider and callback status",
                "Worker alerts"
            ]
        },
        {
            id: "platform-audit",
            phase: "mvp",
            title: "Platform Audit",
            route: "/audit",
            purpose: "Track who performed platform-admin actions, on which tenant, and for what reason.",
            sections: [
                "Actor identity",
                "Target organization",
                "Reason field",
                "Before and after state summary"
            ]
        },
        {
            id: "billing-reconciliation",
            phase: "phase_2",
            title: "Billing Reconciliation",
            route: "/billing",
            purpose: "Investigate provider sync issues, credits, disputes, and grace-period handling.",
            sections: [
                "Provider status",
                "Invoice timeline",
                "Manual credits",
                "Exception handling"
            ]
        },
        {
            id: "support-workspace",
            phase: "phase_2",
            title: "Support Workspace",
            route: "/support",
            purpose: "Centralize support notes, ticket linkage, canned actions, and escalation history.",
            sections: [
                "Support notes",
                "Escalation state",
                "Customer communication summary"
            ]
        },
        {
            id: "feature-flags",
            phase: "phase_2",
            title: "Feature Flags",
            route: "/feature-flags",
            purpose: "Enable staged rollouts, tenant-specific toggles, and emergency kill switches.",
            sections: [
                "Tenant overrides",
                "Rollout cohorts",
                "Emergency toggles"
            ]
        },
        {
            id: "compliance",
            phase: "phase_2",
            title: "Compliance",
            route: "/compliance",
            purpose: "Manage retention, legal hold, tenant export/delete workflows, and policy version tracking.",
            sections: [
                "Retention policy",
                "Export jobs",
                "Deletion workflow",
                "Legal hold"
            ]
        }
    ],
    api: [
        {
            phase: "mvp",
            method: "GET",
            path: "/v1/platform-admin/auth/bootstrap-status",
            summary: "Check whether the owner back office still needs the first platform-admin bootstrap.",
            sensitivity: "platform_metadata"
        },
        {
            phase: "mvp",
            method: "POST",
            path: "/v1/platform-admin/auth/bootstrap",
            summary: "Create the first platform owner via a one-time bootstrap token.",
            sensitivity: "platform_control"
        },
        {
            phase: "mvp",
            method: "POST",
            path: "/v1/platform-admin/auth/login",
            summary: "Primary platform-admin authentication entrypoint.",
            sensitivity: "platform_control"
        },
        {
            phase: "mvp",
            method: "POST",
            path: "/v1/platform-admin/auth/verify-mfa",
            summary: "Second factor verification and step-up token issuance.",
            sensitivity: "platform_control"
        },
        {
            phase: "mvp",
            method: "POST",
            path: "/v1/platform-admin/auth/mfa/setup",
            summary: "Generate a fresh TOTP enrollment kit with QR code and backup codes.",
            sensitivity: "platform_control"
        },
        {
            phase: "mvp",
            method: "POST",
            path: "/v1/platform-admin/auth/mfa/confirm",
            summary: "Confirm TOTP enrollment and rotate the session into MFA-backed access.",
            sensitivity: "platform_control"
        },
        {
            phase: "mvp",
            method: "GET",
            path: "/v1/platform-admin/auth/me",
            summary: "Return the authenticated platform-admin identity and permissions.",
            sensitivity: "platform_metadata"
        },
        {
            phase: "mvp",
            method: "GET",
            path: "/v1/platform-admin/dashboard/summary",
            summary: "High-level organization, billing, security, and ops KPIs.",
            sensitivity: "platform_metadata"
        },
        {
            phase: "mvp",
            method: "GET",
            path: "/v1/platform-admin/organizations",
            summary: "Paginated registry of organizations with filterable metadata.",
            sensitivity: "platform_metadata"
        },
        {
            phase: "mvp",
            method: "GET",
            path: "/v1/platform-admin/organizations/:id",
            summary: "Single organization read model with overview, security, ops, and billing metadata.",
            sensitivity: "platform_metadata"
        },
        {
            phase: "mvp",
            method: "GET",
            path: "/v1/platform-admin/organizations/:id/users",
            summary: "Masked organization-user roster for ownership, status, and MFA review.",
            sensitivity: "platform_metadata"
        },
        {
            phase: "mvp",
            method: "PATCH",
            path: "/v1/platform-admin/organizations/:id/status",
            summary: "Suspend or reactivate an organization account.",
            sensitivity: "platform_control",
            reasonRequired: true
        },
        {
            phase: "mvp",
            method: "PATCH",
            path: "/v1/platform-admin/organizations/:id/plan",
            summary: "Change organization plan or subscription posture.",
            sensitivity: "platform_control",
            reasonRequired: true
        },
        {
            phase: "mvp",
            method: "POST",
            path: "/v1/platform-admin/organizations/:id/security/force-logout",
            summary: "Invalidate active sessions for a tenant owner/support incident.",
            sensitivity: "platform_control",
            reasonRequired: true
        },
        {
            phase: "mvp",
            method: "POST",
            path: "/v1/platform-admin/organizations/:id/security/reset-owner-mfa",
            summary: "Reset owner MFA enrollment as part of a verified recovery flow.",
            sensitivity: "platform_control",
            reasonRequired: true
        },
        {
            phase: "mvp",
            method: "GET",
            path: "/v1/platform-admin/ops/health",
            summary: "Platform operations summary around readiness, backlog, and providers.",
            sensitivity: "platform_metadata"
        },
        {
            phase: "mvp",
            method: "GET",
            path: "/v1/platform-admin/audit-logs",
            summary: "Platform-admin audit stream with actor, target, and reason metadata.",
            sensitivity: "platform_metadata"
        },
        {
            phase: "phase_2",
            method: "GET",
            path: "/v1/platform-admin/billing/reconciliation",
            summary: "Provider reconciliation, dispute review, and invoice exception handling.",
            sensitivity: "platform_metadata"
        },
        {
            phase: "phase_2",
            method: "GET",
            path: "/v1/platform-admin/feature-flags",
            summary: "View staged rollouts, tenant overrides, and emergency toggles.",
            sensitivity: "platform_metadata"
        },
        {
            phase: "phase_2",
            method: "POST",
            path: "/v1/platform-admin/break-glass/request",
            summary: "Request time-bound break-glass access with approval and full audit.",
            sensitivity: "platform_control",
            reasonRequired: true
        }
    ],
    nextImplementationSteps: [
        "Introduce separate platform-admin audit tables and reason-enforced mutation DTOs.",
        "Replace the local repository-backed read path with a PostgreSQL-safe privileged strategy for production-like platform-admin metadata access.",
        "Add read-only platform audit and operations endpoints on top of allow-listed DTOs.",
        "Add break-glass approvals only after audit, TTL, and dual-control policies exist."
    ]
};

//# sourceMappingURL=platform-admin.blueprint.js.map