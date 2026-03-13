/**
 * Email Templates
 */
export interface EmailTemplate {
  id: string;
  name: string;
  template_type:
    | "welcome"
    | "verification"
    | "password_reset"
    | "invoice_paid"
    | "invoice_overdue"
    | "event_reminder"
    | "calculation_approved"
    | "calculation_rejected"
    | "document_shared"
    | "case_assigned"
    | "case_deadline"
    | "meeting_invitation"
    | "meeting_reminder";

  subject: string;
  preheader_text: string;
  subject_uk: string;

  from_email: string;
  from_name: string;

  content_html: string;
  content_text: string;
  variables?: string[];

  created_at: Date;
  updated_at: Date;
}

const defaultFromEmail = process.env.EMAIL_FROM || "noreply@laworganizer.ua";

/**
 * Welcome Email Template
 */
export const WELCOME_EMAIL: EmailTemplate = {
  id: "email_welcome",
  name: "Welcome Email",
  template_type: "welcome",
  subject: "Ласкаво просимо до LAW ORGANIZER!",
  subject_uk: "Ласкаво просимо до LAW ORGANIZER!",
  preheader_text: "Вітаємо вас у платформі",
  from_email: defaultFromEmail,
  from_name: "LAW ORGANIZER",
  content_html: `
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ласкаво просимо до LAW ORGANIZER!</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: white; text-align: center; padding: 40px 20px;">
            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 20px; display: inline-block; padding: 10px 25px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; color: #e94560;">LAW ORGANIZER</div>
            <h1 style="margin: 0 0 20px 0; font-size: 1.8rem; color: white;">Вітаємо!</h1>
            <p style="margin: 0;">Ваш акаунт успішно створено!</p>
        </div>
        <div style="text-align: center; margin: 40px 0; padding: 0 20px;">
            <p>Дякуємо за реєстрацію в нашій платформі для юристів.</p>
            <a href="/dashboard" style="display: inline-block; padding: 12px 30px; background: linear-gradient(90deg, #e94560 0%, #ff6b6b 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px;">Перейти до Dashboard</a>
        </div>
        <div style="text-align: center; padding: 30px 20px; border-top: 1px solid rgba(0, 0, 0, 0.1); color: #8892b0;">
            <p style="margin: 0; font-size: 0.85rem;">Команда LAW ORGANIZER</p>
            <p style="margin-top: 20px; font-size: 0.85rem;">2025 LAW ORGANIZER SaaS Platform</p>
        </div>
    </div>
</body>
</html>
    `,
  content_text: `Ласкаво просимо до LAW ORGANIZER!

Ваш акаунт успішно створено!

Дякуємо за реєстрацію в нашій платформі для юристів.

Команда LAW ORGANIZER
2025 LAW ORGANIZER SaaS Platform
    `,
  created_at: new Date(),
  updated_at: new Date(),
};

/**
 * Email Verification Template
 */
export const VERIFICATION_EMAIL: EmailTemplate = {
  id: "email_verification",
  name: "Email Verification Email",
  template_type: "verification",
  subject: "Підтвердіть вашу пошту",
  subject_uk: "Підтвердіть вашу пошту",
  preheader_text: "Електронна пошта",
  from_email: defaultFromEmail,
  from_name: "LAW ORGANIZER",
  content_html: `
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Підтвердіть вашу пошту</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4285F4 0%, #323282 100%); color: white; text-align: center; padding: 40px 20px;">
            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 20px;">LAW ORGANIZER</div>
            <h1 style="margin: 0 0 20px 0; font-size: 1.8rem; color: white;">Підтвердіть вашу пошту</h1>
        </div>
        <div style="text-align: center; margin: 40px 0; padding: 0 20px;">
            <p>Для завершення реєстрації, будь ласка, введіть код підтвердження:</p>
            <div style="font-size: 2rem; font-weight: bold; background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;">123456</div>
        </div>
        <div style="text-align: center; padding: 30px 20px; border-top: 1px solid rgba(0, 0, 0, 0.1); color: #8892b0;">
            <p style="margin: 0; font-size: 0.85rem;">2025 LAW ORGANIZER SaaS Platform</p>
        </div>
    </div>
</body>
</html>
    `,
  content_text: `Підтвердіть вашу пошту

Для завершення реєстрації, будь ласка, введіть код підтвердження: 123456

2025 LAW ORGANIZER SaaS Platform
    `,
  created_at: new Date(),
  updated_at: new Date(),
};

/**
 * Password Reset Email Template
 */
export const PASSWORD_RESET_EMAIL: EmailTemplate = {
  id: "email_password_reset",
  name: "Password Reset Email",
  template_type: "password_reset",
  subject: "Скидання паролю",
  subject_uk: "Скидання паролю",
  preheader_text: "Забули пароль",
  from_email: defaultFromEmail,
  from_name: "LAW ORGANIZER",
  content_html: `
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Скидання паролю</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #4285F4 100%); color: white; text-align: center; padding: 40px 20px;">
            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 20px;">LAW ORGANIZER</div>
            <h1 style="margin: 0; font-size: 1.5rem; color: white;">Скидання паролю</h1>
        </div>
        <div style="text-align: center; margin: 40px 0; padding: 0 20px;">
            <p>Ви отримали цей лист, тому що був запит на скидання паролю для вашого акаунту.</p>
            <a href="#" style="display: inline-block; padding: 12px 30px; background: linear-gradient(90deg, #ff6b6b 0%, #4285F4 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px;">Скинути пароль</a>
        </div>
        <div style="text-align: center; padding: 30px 20px; border-top: 1px solid rgba(0, 0, 0, 0.1); color: #8892b0;">
            <p style="margin: 0; font-size: 0.85rem;">Якщо ви не запитували скидання паролю, проігноруйте цей лист.</p>
            <p style="margin-top: 20px; font-size: 0.85rem;">2025 LAW ORGANIZER SaaS Platform</p>
        </div>
    </div>
</body>
</html>
    `,
  content_text: `Скидання паролю

Ви отримали цей лист, тому що був запит на скидання паролю для вашого акаунту.

Якщо ви не запитували скидання паролю, проігноруйте цей лист.

2025 LAW ORGANIZER SaaS Platform
    `,
  created_at: new Date(),
  updated_at: new Date(),
};

/**
 * Invoice Paid Email Template
 */
export const INVOICE_PAID_EMAIL: EmailTemplate = {
  id: "email_invoice_paid",
  name: "Invoice Paid Email",
  template_type: "invoice_paid",
  subject: "Оплата отримана",
  subject_uk: "Оплата отримана",
  preheader_text: "Ваш рахунок оплачено",
  from_email: defaultFromEmail,
  from_name: "LAW ORGANIZER",
  content_html: `
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Оплата отримана</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: white; text-align: center; padding: 40px 20px;">
            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 20px; color: #e94560;">LAW ORGANIZER</div>
            <h1 style="margin: 0 0 20px 0; font-size: 1.8rem; color: white;">Оплата отримана</h1>
        </div>
        <div style="margin: 40px 20px;">
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Номер рахунку:</span>
                    <span style="font-weight: 600;">#INV-2025-0001</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Сума:</span>
                    <span style="font-weight: 600;">2 760,00 грн</span>
                </div>
            </div>
            <div style="text-align: center;">
                <p style="color: #28a745; font-weight: 600;">Оплата успішно отримана!</p>
            </div>
        </div>
        <div style="text-align: center; padding: 30px 20px; border-top: 1px solid rgba(0, 0, 0, 0.1); color: #8892b0;">
            <p style="margin: 0; font-size: 0.85rem;">Команда LAW ORGANIZER</p>
        </div>
    </div>
</body>
</html>
    `,
  content_text: `Оплата отримана

Номер рахунку: #INV-2025-0001
Сума: 2 760,00 грн

Оплата успішно отримана!

Команда LAW ORGANIZER
    `,
  created_at: new Date(),
  updated_at: new Date(),
};

/**
 * Invoice Overdue Email Template
 */
export const INVOICE_OVERDUE_EMAIL: EmailTemplate = {
  id: "email_invoice_overdue",
  name: "Invoice Overdue Email",
  template_type: "invoice_overdue",
  subject: "Прострочена оплата",
  subject_uk: "Прострочена оплата",
  preheader_text: "Нагадування про прострочену оплату",
  from_email: defaultFromEmail,
  from_name: "LAW ORGANIZER",
  content_html: `
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Прострочена оплата</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; text-align: center; padding: 40px 20px;">
            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 20px;">LAW ORGANIZER</div>
            <h1 style="margin: 0; font-size: 1.5rem; color: white;">Прострочена оплата!</h1>
        </div>
        <div style="margin: 40px 20px;">
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; color: #856404;">Рахунок прострочено. Будь ласка, оплатіть якнайшвидше.</p>
            </div>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Номер рахунку:</span>
                    <span style="font-weight: 600;">#INV-2025-0001</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Сума:</span>
                    <span style="font-weight: 600; color: #dc3545;">2 760,00 грн</span>
                </div>
            </div>
        </div>
        <div style="text-align: center; padding: 30px 20px; border-top: 1px solid rgba(0, 0, 0, 0.1); color: #8892b0;">
            <p style="margin: 0; font-size: 0.85rem;">Команда LAW ORGANIZER</p>
        </div>
    </div>
</body>
</html>
    `,
  content_text: `Прострочена оплата!

Рахунок прострочено. Будь ласка, оплатіть якнайшвидше.

Номер рахунку: #INV-2025-0001
Сума: 2 760,00 грн

Команда LAW ORGANIZER
    `,
  created_at: new Date(),
  updated_at: new Date(),
};

/**
 * Event Reminder Email Template
 */
export const EVENT_REMINDER_EMAIL: EmailTemplate = {
  id: "email_event_reminder",
  name: "Event Reminder Email",
  template_type: "event_reminder",
  subject: "Нагадування про подію",
  subject_uk: "Нагадування про подію",
  preheader_text: "Нагадування про майбутню подію",
  from_email: defaultFromEmail,
  from_name: "LAW ORGANIZER",
  content_html: `
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Нагадування про подію</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4285F4 0%, #323282 100%); color: white; text-align: center; padding: 40px 20px;">
            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 20px;">LAW ORGANIZER</div>
            <h1 style="margin: 0; font-size: 1.5rem; color: white;">Нагадування про подію</h1>
        </div>
        <div style="margin: 40px 20px;">
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px;">
                <h2 style="margin: 0 0 15px 0; color: #16213e;">Судове засідання</h2>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Дата/час:</span>
                    <span style="font-weight: 600;">15.02.2025 14:00</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Місце:</span>
                    <span style="font-weight: 600;">Київ</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Справа:</span>
                    <span style="font-weight: 600;">#CASE-2025-0001</span>
                </div>
            </div>
        </div>
        <div style="text-align: center; padding: 30px 20px; border-top: 1px solid rgba(0, 0, 0, 0.1); color: #8892b0;">
            <p style="margin: 0; font-size: 0.85rem;">Команда LAW ORGANIZER</p>
        </div>
    </div>
</body>
</html>
    `,
  content_text: `Нагадування про подію

Судове засідання

Дата/час: 15.02.2025 14:00
Місце: Київ
Справа: #CASE-2025-0001

Команда LAW ORGANIZER
    `,
  created_at: new Date(),
  updated_at: new Date(),
};

/**
 * Calculation Approved Email Template
 */
export const CALCULATION_APPROVED_EMAIL: EmailTemplate = {
  id: "email_calculation_approved",
  name: "Calculation Approved Email",
  template_type: "calculation_approved",
  subject: "Розрахунок схвалено",
  subject_uk: "Розрахунок схвалено",
  preheader_text: "Ваш розрахунок схвалено",
  from_email: defaultFromEmail,
  from_name: "LAW ORGANIZER",
  content_html: `
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Розрахунок схвалено</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-align: center; padding: 40px 20px;">
            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 20px;">LAW ORGANIZER</div>
            <h1 style="margin: 0; font-size: 1.5rem; color: white;">Розрахунок схвалено!</h1>
        </div>
        <div style="margin: 40px 20px;">
            <div style="background: #d4edda; border-radius: 8px; padding: 20px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #155724; font-weight: 600;">Калькуляція #CALC-2025-0001</p>
                <p style="margin: 0; font-size: 2rem; font-weight: bold; color: #155724;">10 000,00 грн</p>
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <p style="color: #28a745;">Ваш розрахунок успішно схвалено!</p>
            </div>
        </div>
        <div style="text-align: center; padding: 30px 20px; border-top: 1px solid rgba(0, 0, 0, 0.1); color: #8892b0;">
            <p style="margin: 0; font-size: 0.85rem;">Команда LAW ORGANIZER</p>
        </div>
    </div>
</body>
</html>
    `,
  content_text: `Розрахунок схвалено!

Калькуляція #CALC-2025-0001
Сума: 10 000,00 грн

Ваш розрахунок успішно схвалено!

Команда LAW ORGANIZER
    `,
  created_at: new Date(),
  updated_at: new Date(),
};

/**
 * All email templates array
 */
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  WELCOME_EMAIL,
  VERIFICATION_EMAIL,
  PASSWORD_RESET_EMAIL,
  INVOICE_PAID_EMAIL,
  INVOICE_OVERDUE_EMAIL,
  EVENT_REMINDER_EMAIL,
  CALCULATION_APPROVED_EMAIL,
];
