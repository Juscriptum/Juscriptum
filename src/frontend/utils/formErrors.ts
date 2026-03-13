export const hasErrorAtPath = (
  errors: Record<string, any> | undefined,
  path: string,
): boolean => {
  if (!errors) {
    return false;
  }

  const segments = path.split(".");
  let current: any = errors;

  for (const segment of segments) {
    if (current == null) {
      return false;
    }

    current = current[segment];
  }

  return Boolean(current);
};

export const hasErrorInPaths = (
  errors: Record<string, any> | undefined,
  paths: string[],
): boolean => paths.some((path) => hasErrorAtPath(errors, path));
