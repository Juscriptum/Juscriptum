import { validate, Validator } from "class-validator";
import { plainToClass, ClassConstructor } from "class-transformer";

const validator = new Validator();

/**
 * Generic validation function
 */
export async function validateDto<T extends object>(
  dtoClass: ClassConstructor<T>,
  data: any,
): Promise<{ errors: any[]; valid: boolean }> {
  const dto = plainToClass(dtoClass, data);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
  });

  const formattedErrors = errors.map((error) => ({
    field: error.property,
    constraints: error.constraints,
    value: error.value,
  }));

  return {
    errors: formattedErrors,
    valid: errors.length === 0,
  };
}

/**
 * Password strength validation
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  errors: string[];
} {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push("Пароль повинен містити мінімум 8 символів");
  } else {
    score += 20;
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Пароль повинен містити маленькі літери");
  } else {
    score += 20;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Пароль повинен містити великі літери");
  } else {
    score += 20;
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Пароль повинен містити цифри");
  } else {
    score += 20;
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push("Пароль повинен містити спеціальні символи");
  } else {
    score += 20;
  }

  return {
    valid: errors.length === 0 && score >= 80,
    score,
    errors,
  };
}

/**
 * Email validation (strict)
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Phone validation (Ukrainian format)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+380\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * EDRPOU validation (Ukrainian company code)
 */
export function validateEdrpou(edrpou: string): boolean {
  return /^\d{8}$/.test(edrpou);
}

/**
 * Tax number validation (Ukrainian INN)
 */
export function validateTaxNumber(taxNumber: string): boolean {
  return /^\d{10,12}$/.test(taxNumber);
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate UUID
 */
export function validateUuid(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Check for SQL injection patterns
 */
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|UNION|EXEC)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
    /(\bOR\b|\bAND\b)\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"]/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: Express.Multer.File,
  allowedMimeTypes: string[],
  maxSizeInBytes: number,
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "Файл не завантажено" };
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: "Невірний формат файлу" };
  }

  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `Розмір файлу перевищує ${maxSizeInBytes / 1024 / 1024} MB`,
    };
  }

  // Check for malicious file extensions
  const dangerousExtensions = [".exe", ".bat", ".sh", ".php", ".js", ".vbs"];
  const fileExtension = file.originalname.toLowerCase();
  if (dangerousExtensions.some((ext) => fileExtension.endsWith(ext))) {
    return { valid: false, error: "Заборонений тип файлу" };
  }

  return { valid: true };
}

/**
 * Rate limit key generator
 */
export function generateRateLimitKey(
  identifier: string,
  action: string,
  tenantId?: string,
): string {
  const parts = ["ratelimit", identifier, action];
  if (tenantId) {
    parts.push(tenantId);
  }
  return parts.join(":");
}
