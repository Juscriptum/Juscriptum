import React from "react";
import { Link, matchPath, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface RouteBreadcrumb {
  path: string;
  items: BreadcrumbItem[];
}

const ROUTE_BREADCRUMBS: RouteBreadcrumb[] = [
  {
    path: "/dashboard",
    items: [{ label: "Головна" }],
  },
  {
    path: "/clients",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Мої клієнти" }],
  },
  {
    path: "/clients/add",
    items: [
      { label: "Головна", to: "/dashboard" },
      { label: "Мої клієнти", to: "/clients" },
      { label: "Додати клієнта" },
    ],
  },
  {
    path: "/clients/:id",
    items: [
      { label: "Головна", to: "/dashboard" },
      { label: "Мої клієнти", to: "/clients" },
      { label: "Клієнт" },
    ],
  },
  {
    path: "/cases",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Мої справи" }],
  },
  {
    path: "/cases/add",
    items: [
      { label: "Головна", to: "/dashboard" },
      { label: "Мої справи", to: "/cases" },
      { label: "Додати справу" },
    ],
  },
  {
    path: "/cases/:id",
    items: [
      { label: "Головна", to: "/dashboard" },
      { label: "Мої справи", to: "/cases" },
      { label: "Справа" },
    ],
  },
  {
    path: "/documents",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Файли" }],
  },
  {
    path: "/calendar",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Календар" }],
  },
  {
    path: "/pricelists",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Прайс-листи" }],
  },
  {
    path: "/pricelists/add",
    items: [
      { label: "Головна", to: "/dashboard" },
      { label: "Прайс-листи", to: "/pricelists" },
      { label: "Додати прайс" },
    ],
  },
  {
    path: "/pricelists/:id/edit",
    items: [
      { label: "Головна", to: "/dashboard" },
      { label: "Прайс-листи", to: "/pricelists" },
      { label: "Редагування прайсу" },
    ],
  },
  {
    path: "/pricelists/:id",
    items: [
      { label: "Головна", to: "/dashboard" },
      { label: "Прайс-листи", to: "/pricelists" },
      { label: "Прайс" },
    ],
  },
  {
    path: "/calculations",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Розрахунки" }],
  },
  {
    path: "/activity",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Активність" }],
  },
  {
    path: "/reports",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Звіти" }],
  },
  {
    path: "/print-forms",
    items: [
      { label: "Головна", to: "/dashboard" },
      { label: "Конструктор шаблонів" },
    ],
  },
  {
    path: "/notes",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Нотатки" }],
  },
  {
    path: "/archive",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Архів" }],
  },
  {
    path: "/chat",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Чат" }],
  },
  {
    path: "/mail",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Пошта" }],
  },
  {
    path: "/billing",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Білінг" }],
  },
  {
    path: "/profile",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Мій профіль" }],
  },
  {
    path: "/users",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Користувачі" }],
  },
  {
    path: "/settings",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Налаштування" }],
  },
  {
    path: "/audit",
    items: [{ label: "Головна", to: "/dashboard" }, { label: "Аудит" }],
  },
];

const getBreadcrumbsForPath = (pathname: string): BreadcrumbItem[] => {
  const matchedRoute = ROUTE_BREADCRUMBS.find((route) =>
    matchPath({ path: route.path, end: true }, pathname),
  );

  return matchedRoute?.items ?? [{ label: "Головна" }];
};

export const Breadcrumbs: React.FC<{
  items?: BreadcrumbItem[];
  className?: string;
}> = ({ items, className = "" }) => {
  const location = useLocation();
  const breadcrumbs = items ?? getBreadcrumbsForPath(location.pathname);

  if (breadcrumbs.length <= 1) {
    return (
      <nav
        aria-label="Breadcrumb"
        className={`breadcrumbs ${className}`.trim()}
      >
        <ol className="breadcrumbs-list">
          <li className="breadcrumbs-item" aria-current="page">
            {breadcrumbs[0].label}
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={`breadcrumbs ${className}`.trim()}>
      <ol className="breadcrumbs-list">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="breadcrumbs-item"
              aria-current={isLast ? "page" : undefined}
            >
              {item.to && !isLast ? (
                <Link to={item.to} className="breadcrumbs-link">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "breadcrumbs-current" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
