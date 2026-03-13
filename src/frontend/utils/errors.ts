export const getErrorMessage = (error: unknown, fallback: string): string => {
  const responseMessage = (error as any)?.response?.data?.message;

  if (Array.isArray(responseMessage)) {
    const normalized = responseMessage
      .map((item) => String(item).trim())
      .filter(Boolean);

    if (normalized.length > 0) {
      return normalized.join(". ");
    }
  }

  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
};
