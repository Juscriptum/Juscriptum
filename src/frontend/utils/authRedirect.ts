const LOGIN_REDIRECT_PARAM = "redirect";
const DEFAULT_AUTH_REDIRECT = "/dashboard";

const isBlockedRedirectTarget = (value: string): boolean => {
  return (
    value === "/" || value.startsWith("/login") || value.startsWith("/register")
  );
};

export const normalizeRedirectTarget = (
  value?: string | null,
): string | null => {
  if (!value) {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return isBlockedRedirectTarget(value) ? null : value;
};

export const getAuthRedirectTarget = (search?: string): string => {
  const params = new URLSearchParams(search || "");
  return (
    normalizeRedirectTarget(params.get(LOGIN_REDIRECT_PARAM)) ||
    DEFAULT_AUTH_REDIRECT
  );
};

export const buildLoginRedirectPath = (
  pathname: string,
  search = "",
  hash = "",
): string => {
  const redirectTarget =
    normalizeRedirectTarget(`${pathname}${search}${hash}`) ||
    DEFAULT_AUTH_REDIRECT;
  const params = new URLSearchParams();
  params.set(LOGIN_REDIRECT_PARAM, redirectTarget);
  return `/login?${params.toString()}`;
};

export const buildWindowLoginRedirectPath = (): string => {
  if (typeof window === "undefined") {
    return "/login";
  }

  return buildLoginRedirectPath(
    window.location.pathname,
    window.location.search,
    window.location.hash,
  );
};
