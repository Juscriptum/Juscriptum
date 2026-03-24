"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get detectSqlInjection () {
        return detectSqlInjection;
    },
    get generateRateLimitKey () {
        return generateRateLimitKey;
    },
    get sanitizeInput () {
        return sanitizeInput;
    },
    get validateDto () {
        return validateDto;
    },
    get validateEdrpou () {
        return validateEdrpou;
    },
    get validateEmail () {
        return validateEmail;
    },
    get validateFileUpload () {
        return validateFileUpload;
    },
    get validatePasswordStrength () {
        return validatePasswordStrength;
    },
    get validatePhone () {
        return validatePhone;
    },
    get validateTaxNumber () {
        return validateTaxNumber;
    },
    get validateUuid () {
        return validateUuid;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const validator = new _classvalidator.Validator();
async function validateDto(dtoClass, data) {
    const dto = (0, _classtransformer.plainToClass)(dtoClass, data);
    const errors = await (0, _classvalidator.validate)(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true
    });
    const formattedErrors = errors.map((error)=>({
            field: error.property,
            constraints: error.constraints,
            value: error.value
        }));
    return {
        errors: formattedErrors,
        valid: errors.length === 0
    };
}
function validatePasswordStrength(password) {
    const errors = [];
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
        errors
    };
}
function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}
function validatePhone(phone) {
    const phoneRegex = /^\+380\d{9}$/;
    return phoneRegex.test(phone);
}
function validateEdrpou(edrpou) {
    return /^\d{8}$/.test(edrpou);
}
function validateTaxNumber(taxNumber) {
    return /^\d{10,12}$/.test(taxNumber);
}
function sanitizeInput(input) {
    return input.replace(/[<>]/g, "") // Remove < and >
    .trim().substring(0, 1000); // Limit length
}
function validateUuid(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
function detectSqlInjection(input) {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|UNION|EXEC)\b)/i,
        /(--|\/\*|\*\/|;)/,
        /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
        /(\bOR\b|\bAND\b)\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"]/i
    ];
    return sqlPatterns.some((pattern)=>pattern.test(input));
}
function validateFileUpload(file, allowedMimeTypes, maxSizeInBytes) {
    if (!file) {
        return {
            valid: false,
            error: "Файл не завантажено"
        };
    }
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return {
            valid: false,
            error: "Невірний формат файлу"
        };
    }
    if (file.size > maxSizeInBytes) {
        return {
            valid: false,
            error: `Розмір файлу перевищує ${maxSizeInBytes / 1024 / 1024} MB`
        };
    }
    // Check for malicious file extensions
    const dangerousExtensions = [
        ".exe",
        ".bat",
        ".sh",
        ".php",
        ".js",
        ".vbs"
    ];
    const fileExtension = file.originalname.toLowerCase();
    if (dangerousExtensions.some((ext)=>fileExtension.endsWith(ext))) {
        return {
            valid: false,
            error: "Заборонений тип файлу"
        };
    }
    return {
        valid: true
    };
}
function generateRateLimitKey(identifier, action, tenantId) {
    const parts = [
        "ratelimit",
        identifier,
        action
    ];
    if (tenantId) {
        parts.push(tenantId);
    }
    return parts.join(":");
}

//# sourceMappingURL=validation.util.js.map