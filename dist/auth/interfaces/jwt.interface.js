"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SecurityConfig", {
    enumerable: true,
    get: function() {
        return SecurityConfig;
    }
});
const SecurityConfig = {
    // JWT
    JWT_ACCESS_TOKEN_EXPIRY: "15m",
    JWT_REFRESH_TOKEN_EXPIRY: "7d",
    JWT_ALGORITHM: "HS256",
    // Password
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    PASSWORD_SALT_ROUNDS: 12,
    PASSWORD_RESET_EXPIRY: "1h",
    PASSWORD_MAX_HISTORY: 5,
    // Rate Limiting
    RATE_LIMIT_WINDOW: 15 * 60 * 1000,
    RATE_LIMIT_MAX_ATTEMPTS: 5,
    RATE_LIMIT_BAN_DURATION: 15 * 60 * 1000,
    // MFA
    MFA_TOTP_DIGITS: 6,
    MFA_TOTP_PERIOD: 30,
    MFA_TOTP_WINDOW: 2,
    // Session
    MAX_REFRESH_TOKENS_PER_USER: 5,
    MAX_CONCURRENT_SESSIONS: 10,
    // Lockout
    MAX_FAILED_LOGIN_ATTEMPTS: 5,
    ACCOUNT_LOCKOUT_DURATION: 30 * 60 * 1000,
    // Encryption
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    ENCRYPTION_ALGORITHM: "aes-256-gcb"
};

//# sourceMappingURL=jwt.interface.js.map