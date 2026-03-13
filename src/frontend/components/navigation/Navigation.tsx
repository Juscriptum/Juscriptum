import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../../common/Logo";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../hooks/useAuth";
import { Breadcrumbs } from "./Breadcrumbs";
import { buildLoginRedirectPath } from "../../utils/authRedirect";
import {
  Activity,
  Archive,
  BadgeDollarSign,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  FileSpreadsheet,
  Files,
  Gauge,
  LibraryBig,
  Mail,
  Menu,
  MessageSquareMore,
  NotebookText,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  Users,
  X,
} from "lucide-react";
import "./Navigation.css";

/**
 * Menu item configuration
 */
interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  section?: "primary" | "secondary";
  /**
   * Required roles to see this menu item (any of these)
   */
  roles?: string[];
  /**
   * Required features to see this menu item (all of these)
   */
  features?: string[];
  /**
   * Custom permission check function
   */
  permissionCheck?: (permissions: ReturnType<typeof usePermissions>) => boolean;
  /**
   * Badge content (e.g., notification count)
   */
  badge?: string | number;
  /**
   * Is this item visible?
   */
  visible?: boolean;
}

/**
 * All menu items configuration
 */
const MENU_ITEMS: MenuItem[] = [
  {
    id: "home",
    label: "Головна",
    icon: <Gauge size={18} />,
    path: "/dashboard",
    section: "primary",
    visible: true,
  },
  {
    id: "clients",
    label: "Мої клієнти",
    icon: <Users size={18} />,
    path: "/clients",
    section: "primary",
    roles: ["organization_owner", "organization_admin", "lawyer", "assistant"],
  },
  {
    id: "cases",
    label: "Мої справи",
    icon: <BriefcaseBusiness size={18} />,
    path: "/cases",
    section: "primary",
    roles: ["organization_owner", "organization_admin", "lawyer", "assistant"],
    permissionCheck: (p) => p.canViewCases(),
  },
  {
    id: "calendar",
    label: "Календар",
    icon: <CalendarDays size={18} />,
    path: "/calendar",
    section: "primary",
    roles: ["organization_owner", "organization_admin", "lawyer", "assistant"],
  },
  {
    id: "pricelists",
    label: "Прайс-лист",
    icon: <LibraryBig size={18} />,
    path: "/pricelists",
    section: "primary",
    roles: ["organization_owner", "organization_admin", "lawyer", "assistant"],
  },
  {
    id: "documents",
    label: "Файли",
    icon: <Files size={18} />,
    path: "/documents",
    section: "primary",
    roles: ["organization_owner", "organization_admin", "lawyer", "assistant"],
    permissionCheck: (p) => p.canManageDocuments(),
  },
  {
    id: "calculations",
    label: "Розрахунки",
    icon: <Calculator size={18} />,
    path: "/calculations",
    section: "primary",
    roles: ["organization_owner", "organization_admin", "lawyer", "assistant"],
  },
  {
    id: "print-forms",
    label: "Конструктор шаблонів",
    icon: <Printer size={18} />,
    path: "/print-forms",
    section: "primary",
    roles: ["organization_owner", "organization_admin", "lawyer", "assistant"],
  },
  {
    id: "notes",
    label: "Нотатки",
    icon: <NotebookText size={18} />,
    path: "/notes",
    section: "primary",
    roles: ["organization_owner", "organization_admin", "lawyer", "assistant"],
  },
  {
    id: "archive",
    label: "Архів",
    icon: <Archive size={18} />,
    path: "/archive",
    section: "primary",
    roles: ["organization_owner", "organization_admin", "lawyer", "assistant"],
  },
  {
    id: "chat",
    label: "Чат",
    icon: <MessageSquareMore size={18} />,
    path: "/chat",
    section: "primary",
    roles: ["organization_owner", "organization_admin", "lawyer", "assistant"],
  },
  {
    id: "mail",
    label: "Пошта",
    icon: <Mail size={18} />,
    path: "/mail",
    section: "primary",
    roles: ["organization_owner", "organization_admin", "lawyer", "assistant"],
  },
  {
    id: "activity",
    label: "Активність",
    icon: <Activity size={18} />,
    path: "/activity",
    section: "secondary",
    roles: ["organization_owner", "organization_admin", "lawyer", "assistant"],
  },
  {
    id: "reports",
    label: "Звіти",
    icon: <FileSpreadsheet size={18} />,
    path: "/reports",
    section: "secondary",
    roles: ["organization_owner", "organization_admin", "accountant", "lawyer"],
  },
  {
    id: "profile",
    label: "Мій профіль",
    icon: <CircleUserRound size={18} />,
    path: "/profile",
    section: "secondary",
    roles: [
      "organization_owner",
      "organization_admin",
      "lawyer",
      "assistant",
      "accountant",
    ],
  },
  {
    id: "users",
    label: "Користувачі",
    icon: <Users size={18} />,
    path: "/users",
    section: "secondary",
    roles: ["organization_owner", "organization_admin"],
    permissionCheck: (p) => p.canManageUsers(),
  },
  {
    id: "settings",
    label: "Налаштування",
    icon: <LibraryBig size={18} />,
    path: "/settings",
    section: "secondary",
    roles: ["organization_owner", "organization_admin"],
    permissionCheck: (p) => p.canManageSettings(),
  },
];

/**
 * Feature flags component
 */
interface FeatureFlagProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureFlag: React.FC<FeatureFlagProps> = ({
  feature,
  fallback,
  children,
}) => {
  const permissions = usePermissions();

  if (!permissions.hasFeature(feature as any)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * Role-based render component
 */
interface RoleBasedProps {
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleBased: React.FC<RoleBasedProps> = ({
  roles,
  requireAll = false,
  fallback,
  children,
}) => {
  const permissions = usePermissions();

  if (!roles || roles.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = requireAll
    ? roles.every((role) => permissions.hasRole([role as any]))
    : permissions.hasRole(roles as any[]);

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * Permission-based render component
 */
interface PermissionBasedProps {
  check: (permissions: ReturnType<typeof usePermissions>) => boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionBased: React.FC<PermissionBasedProps> = ({
  check,
  fallback,
  children,
}) => {
  const permissions = usePermissions();

  if (!check(permissions)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * Sidebar Navigation Component
 */
interface SidebarNavigationProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  isCollapsed,
  onToggle,
}) => {
  const permissions = usePermissions();

  /**
   * Check if menu item should be visible
   */
  const isItemVisible = (item: MenuItem): boolean => {
    // Check visibility flag
    if (item.visible === false) return false;

    // Check role requirement
    if (item.roles && !permissions.hasRole(item.roles as any[])) {
      return false;
    }

    // Check feature requirement
    if (item.features) {
      const hasAllFeatures = item.features.every((feature) =>
        permissions.hasFeature(feature as any),
      );
      if (!hasAllFeatures) return false;
    }

    // Check custom permission
    if (item.permissionCheck && !item.permissionCheck(permissions)) {
      return false;
    }

    return true;
  };

  const visibleItems = MENU_ITEMS.filter(isItemVisible);
  const primaryItems = visibleItems.filter(
    (item) => item.section !== "secondary",
  );
  const secondaryItems = visibleItems.filter(
    (item) => item.section === "secondary",
  );

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="logo">
          <Logo size="small" variant="light" showText={!isCollapsed} />
        </div>
        <button
          className="collapse-button"
          onClick={onToggle}
          aria-label={
            isCollapsed ? "Розгорнути бічне меню" : "Згорнути бічне меню"
          }
          title={isCollapsed ? "Розгорнути меню" : "Згорнути меню"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={15} />
          ) : (
            <PanelLeftClose size={15} />
          )}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {primaryItems.map((item) => (
            <li key={item.id} className="nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                aria-label={item.label}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        {secondaryItems.length > 0 && (
          <ul className="nav-list nav-list-secondary">
            {secondaryItems.map((item) => (
              <li key={item.id} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active" : ""}`
                  }
                  aria-label={item.label}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      {item.badge && (
                        <span className="nav-badge">{item.badge}</span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
};

/**
 * Top Navigation Bar Component
 */
interface TopNavigationProps {
  isSidebarCollapsed: boolean;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  isSidebarCollapsed,
}) => {
  const permissions = usePermissions();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat("uk-UA", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
    [],
  );

  useEffect(() => {
    const closeMenu = () => setShowUserMenu(false);
    window.addEventListener("click", closeMenu);

    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(
      buildLoginRedirectPath(location.pathname, location.search, location.hash),
      { replace: true },
    );
  };

  return (
    <div className={`top-navigation ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="top-nav-left">
        <div className="workspace-pulse">
          <span className="workspace-pulse-label">Робочий день</span>
          <strong>{currentDate}</strong>
        </div>
        <Breadcrumbs className="top-breadcrumbs" />
      </div>

      <div className="top-nav-right">
        {/* Subscription badge */}
        {permissions.organization && (
          <div className="subscription-badge">
            <span className={`plan-badge ${permissions.getPlan()}`}>
              <BadgeDollarSign size={14} />
              {permissions.getPlan()}
            </span>
          </div>
        )}

        {/* Notifications */}
        <button className="notification-button" aria-label="Сповіщення">
          <Activity size={18} />
          <span className="notification-dot"></span>
        </button>

        {/* User menu */}
        <div className="user-menu-container">
          <button
            className="user-menu-button"
            onClick={(event) => {
              event.stopPropagation();
              setShowUserMenu(!showUserMenu);
            }}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            aria-label="Відкрити меню користувача"
          >
            <div className="user-avatar-small">
              {permissions.user?.firstName?.charAt(0) || "?"}
            </div>
            <span className="user-name-small">
              {permissions.user?.firstName}
            </span>
          </button>

          {showUserMenu && (
            <div
              className="user-menu-dropdown"
              role="menu"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="menu-header">
                <strong>
                  {permissions.user?.firstName} {permissions.user?.lastName}
                </strong>
                <span className="menu-email">{permissions.user?.email}</span>
              </div>
              <div className="menu-divider"></div>
              <button
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  navigate("/profile");
                  setShowUserMenu(false);
                }}
              >
                <CircleUserRound size={16} /> Профіль
              </button>
              {permissions.canManageBilling() && (
                <button
                  className="menu-item"
                  role="menuitem"
                  onClick={() => {
                    navigate("/billing");
                    setShowUserMenu(false);
                  }}
                >
                  <BadgeDollarSign size={16} /> Підписка
                </button>
              )}
              {permissions.canManageUsers() && (
                <button
                  className="menu-item"
                  role="menuitem"
                  onClick={() => {
                    navigate("/users");
                    setShowUserMenu(false);
                  }}
                >
                  <Users size={16} /> Користувачі
                </button>
              )}
              <button
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  navigate("/settings");
                  setShowUserMenu(false);
                }}
              >
                <LibraryBig size={16} /> Налаштування
              </button>
              <div className="menu-divider"></div>
              <button
                className="menu-item logout"
                role="menuitem"
                onClick={handleLogout}
              >
                <ChevronRight size={16} /> Вийти
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Mobile Navigation Component
 */
export const MobileNavigation: React.FC = () => {
  const permissions = usePermissions();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isItemVisible = (item: MenuItem): boolean => {
    if (item.visible === false) return false;
    if (item.roles && !permissions.hasRole(item.roles as any[])) return false;
    if (item.features) {
      const hasAllFeatures = item.features.every((feature) =>
        permissions.hasFeature(feature as any),
      );
      if (!hasAllFeatures) return false;
    }
    if (item.permissionCheck && !item.permissionCheck(permissions))
      return false;
    return true;
  };

  const visibleItems = MENU_ITEMS.filter(isItemVisible);
  const mobilePrimaryItems = visibleItems.filter(
    (item) => item.section !== "secondary",
  );
  const mobileSecondaryItems = visibleItems.filter(
    (item) => item.section === "secondary",
  );

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", isMenuOpen);

    return () => {
      document.body.classList.remove("mobile-menu-open");
    };
  }, [isMenuOpen]);

  return (
    <div className={`mobile-navigation ${isMenuOpen ? "menu-open" : ""}`}>
      <div className="mobile-nav-header">
        <div className="mobile-logo">
          <BriefcaseBusiness size={18} />
          <span>Law Organizer</span>
        </div>
        <button
          className="mobile-menu-button"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-label={
            isMenuOpen ? "Закрити мобільне меню" : "Відкрити мобільне меню"
          }
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu-drawer"
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isMenuOpen && (
        <button
          className="mobile-menu-scrim"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Закрити меню"
        />
      )}

      {isMenuOpen && (
        <aside
          className="mobile-menu-drawer"
          id="mobile-menu-drawer"
          aria-label="Мобільна навігація"
        >
          <div className="mobile-menu-section">
            <span className="mobile-menu-section-title">Основні модулі</span>
            {mobilePrimaryItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `mobile-menu-item ${isActive ? "active" : ""}`
                }
                onClick={() => {
                  setIsMenuOpen(false);
                }}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {mobileSecondaryItems.length > 0 && (
            <div className="mobile-menu-section mobile-menu-section-secondary">
              <span className="mobile-menu-section-title">
                Додаткові розділи
              </span>
              {mobileSecondaryItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    `mobile-menu-item ${isActive ? "active" : ""}`
                  }
                  onClick={() => {
                    setIsMenuOpen(false);
                  }}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </aside>
      )}
    </div>
  );
};

export default SidebarNavigation;
