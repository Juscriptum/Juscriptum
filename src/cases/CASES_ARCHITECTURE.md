/**
 * Case Management Module - Architecture & Design
 * ==========================================
 *
 * Module: Cases (Повна справи)
 *
 * Description: Управління судовими справами та документами
 *
 * Features:
 * - CRUD операції зі справами
 * - Зв'язок з клієнтами та документами
 * - Статуси справ (відкрита, розгляд, закрита, призупинена)
 * - Дедлайни та нагадування
 * - Судові засідання, дедлайни
 * - Фільтри за статусом, типом, пріоритетом
 * - Пошук (ILIKE + Elasticsearch)
 * - Події/документів (автоматичне прив'язування до справ)
 * - Тайм-трекінг (хвилини)
 * - Історія змін статусів
 * - Теги та категорії справ
 */

## Module Boundaries

### 1. Tenant Impact
- Всі операції обмежені `tenant_id`
- TenantGuard обов'язує доступ до даних іншого тенанту

### 2. RBAC Matrix

| Роль | Перегляди | Редагувати | Створити | Архівувати |
|------|---------|----------|----------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ |
| ORGANIZATION_OWNER | ✅ | ✅ | ✅ | ✅ |
| ORGANIZATION_ADMIN | ✅ | ✅ | ❌ | ✅ |
| LAWYER | ✅ | ✅ | ❌ | ❌ | ✅ |
| ASSISTANT | ✅ | ✅ | ❌ | ❌ | ❌ |
| ACCOUNTANT | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3. Subscription Gating

| Функція | Basic | Professional | Enterprise |
|-----------|-----------|-------------|------------|
| Макс справ | 10 | 50 | Unlimited |
| Тайм-трекінг (хв) | ✅ | ✅ |
| Автоматичне прив'язування документів | ❌ | ✅ | ✅ |
| Експорт даних (Excel/PDF) | ❌ | ✅ | ✅ |
| Custom поля в справах | ❌ | ✅ | ✅ |
| API доступ для клієнтів | ❌ | ✅ | ✅ |

### 4. State Machine

```
[INITIAL] → [IN_REVIEW] → [ACTIVE] → [ON_HOLD] → [CLOSED] → [ARCHIVED]
                 ↓            ↓           ↓           ↓          ↓
                 ↓           ↓
                 ↓           ↓
```

**State Transitions:**
- INITIAL → IN_REVIEW (створено справу)
- IN_REVIEW → ACTIVE (юрист/справ прийнявся)
- ACTIVE → ON_HOLD (тимчасово призупинена)
- ON_HOLD → ACTIVE (відновлено призупинення)
- ACTIVE → CLOSED (справа закрита)
- ACTIVE → ARCHIVED (архівовано)
- CLOSED → ACTIVE (відновлено архівування)

### 5. Plan Gating Table

| Функція | Scope |
|-----------|-------|
| Створення справи | CasesService.create() |
| Редагування справи | CasesService.update() |
| Видалення справи | CasesService.delete() |
| Завантаження документів | DocumentService.upload() |
- Відправки документів | DocumentService.update() |
| Видалення документів | DocumentService.delete() |
| Підпис документів | DocumentService.sign()
| Отримання документів (URL) | DocumentService.getSignedUrl() |
- Статуси справ | CasesService.updateStatus() |
| Дедлайни справи | CasesService.updateDeadline() |
- Звіти про справу | ActivityService.create()

### 6. Access Matrix

| Ресурса | OWNER | ADMIN | LAWYER | ASSISTANT | ACCOUNTANT |
|---------|-------|-------|--------|----------|
| /api/v1/cases/* | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| /api/v1/events/* | ✅ | ✅ ✅ ✅ | ✅ | ✅ ✅ |
| /api/v1/documents/* | ✅ | ✅ ✅ ✅ ✅ | ✅ ✅ |
| /api/v1/activities/* | ✅ ✅ | ✅ | ✅ ✅ | ✅ ✅ ✅ |

### 7. Feature Flags

| Feature | Key | Default | Enterprise-Only |
|--------|-----|---------|
| Автоматичне прив'язування документів | docs.auto_attach_docs | false | true |
| Eкспорт даних | cases.export_data | false | true |
| API для клієнтів | clients.api_access | false | true |
| Кастом поля в справах | cases.custom_fields | false | true |
| Електронний підпис документів | docs.electronic_sign | false | true |
| Розширення справ по тегам | cases.case_categories | false | true |

## API Endpoints

| Метод | Ендпоінт | Опис |
|--------|--------|------|
| GET /api/v1/cases | Отримання списку справ |
| GET /api/v1/cases/:id | Отримання справи по ID |
| POST /api/v1/cases | Створення нової справи |
| PUT /api/v1/cases/:id | Редагування справи |
| DELETE /api/v1/cases/:id | Видалення справи (soft delete) |
| PATCH /api/v1/cases/:id/status | Зміна статусу |
| POST /api/v1/cases/:id/archive | Архівування справи |
| GET /api/v1/cases/:id/documents | Отримання документів справи |
| POST /api/v1/cases/:id/documents | Завантаження документів |
| PUT /api/v1/cases/:id/documents/:id | Редагування документа |
| DELETE /api/v1/cases/:id/documents/:id | Видалення документа (soft delete) |
| POST /api/v1/cases/:id/documents/:id/sign | Підписання документа |
| GET /api/v1/cases/:id/events | Отримання подій по справі |
| POST /api/v1/cases/:id/events | Створення події |
| PUT /api/v1/cases/:id/events/:id | Редагування події |
| DELETE /api/v1/cases/:id/events/:id | Видалення події |

## Business Rules

### 1. Case Creation Rules
- Під час створення (14 днів) можна змінювати опис/категорію
- Номер справи генерується автоматично (INV-CASE-YYYY-MM-XXXX)
- Статус по замовчуванню - draft

### 2. Case Assignment Rules
- Операція може бути призначена тільки юристи/адмінистраторам
- Автоматичне призначення за найменшій навантаженість
- Юрист не може мати > 10 активних справ

### 3. Case Status Rules
- Нові справи → draft → in_review
- Після редагування → active
- Закрита справи не можуть бути видалені, тільки архівовані

### 4. Document Attachment Rules
- Автоматичне прив'язування документів при створені справи
- Максимальний розмір файлу - 50 MB
- Підписані документи не можуть бути змінені
- Усі версії документів зберігаються

### 5. Event Rules
- Дедлайн вважливий - автоматичне нагадування за 1, 3, 7 днів
- Судові засідання важливі - нагадування за 1, 2, 3 дні

## Data Model Considerations

### 1. Indexes Required
- tenant_id (WHERE clause на всі запити)
- case_number (для швидимого номеру)
- status (для фільтрації)
- priority (для сортування)
- created_at (for date range)
- case_id (для зв'язку з документами)
- tenant_id (на documents таблиці)
- uploaded_by (audit trail)

### 2. Full-Text Search
- Elasticsearch для повнотекстового пошу
- Пошук по номеру справи, назві клієнта
- Пошук по опису справи

### 3. Soft Delete Strategy
- `deleted_at` не NULL` - активні записи
- `deleted_at NOT NULL` - видалені записи
- Очищення через 30 днів (cron job)

### 4. Audit Requirements
- Всі CRUD операції логуються
- Статус змін логується з old → new
- User ID, IP, timestamp

## Security Considerations

### 1. Cross-Tenant Data Access Prevention
- Всі запити включають `WHERE tenant_id = currentTenantId`
- JOIN з users перевіряє `AND u.tenant_id = c.tenantId`

### 2. Broken Access Control Prevention
- GET /api/v1/cases/:id перевіряє, що user має доступ до цієї справи
- PATCH /api/v1/cases/:id перевіряє, що це ORGANIZATION_OWNER або LAWYER

### 3. SQL Injection Prevention
- Параметризовані запити через TypeORM
- No raw SQL без попередньої перевірки

### 4. XSS Prevention
- Всі текстові поля валідуються на XSS
- Content-Type: application/json з перевіркою

### 5. Subscription Bypass Prevention
- Статус змін перевіряється на рівні підписки
- Дедлайн не може бути змінений на lower плані

## Performance Considerations

### 1. Indexing Strategy
- Часто фільтруються: status, priority, created_at
- Складовий індекс на `case_number` (VARCHAR pattern matching)

### 2. Query Optimization
- SELECT з JOIN з relations використовує LEFT JOIN
- Пагінація 20 записів на сторінку
- Use SELECT тільки необхідні поля

### 3. Caching Strategy
- Redis кеш для часто запитуваних даних
- TTL: 300s для списків справ

### 4. Bulk Operations
- Булькове видалення документів (максимум 10 за раз)
- Булькове оновлення статусів (максимум 50 за раз)

## API Response Times

| Ендпоінт | Target |
|----------|--------|
| GET /api/v1/cases | < 200ms |
| GET /api/v1/cases/:id | < 150ms |
| POST /api/v1/cases | < 300ms |
| PUT /api/v1/cases/:id | < 250ms |
| DELETE /api/v1/cases/:id | < 200ms |
| POST /api/v1/cases/:id/documents | < 500ms |

## Metrics to Track

| Метрика | Target |
|---------|--------|
| API Response Time | P95 < 200ms |
| Database Query Time | P90 < 200ms |
| Cache Hit Rate | > 80% |
| Error Rate | < 0.5% |
| Active Users | 1000+ |
| Daily New Cases | 10-100 |

## Integration Points

### 1. Existing Modules
- **Clients Module** - `caseId` в client entity (one-to-many)
- **Documents Module** - `caseId` в document entity (many-to-one)
- **Events Module** - `caseId` в event entity (many-to-one)
- **Activities Module** - `caseId` в activity entity (one-to-many)

### 2. Shared Tables
- **AuditLogs** - `tenant_id`, `entity_type`, `entity_id`
- **Subscriptions** - `tenant_id` → Subscription status gating`

### 3. Common Utilities
- **Validation** - validateEdrpou, validateTaxNumber
- **Crypto** - password hashing, signatures
- **Audit Service** - logging all CRUD operations

## Dependencies (успад від інших модулів)

### Backend Dependencies:
- @nestjs/common
- @nestjs/typeorm
- @nestjs/jwt
- @nestjs/passport
- @nestjs/swagger
- @nestjs/config
- @nestjs/throttler
- @nestjs/schedule
- @nestjs/microservices

### Frontend Dependencies:
- React
- Redux Toolkit
- React Router v6
- React Hook Form
- Redux Thunk
- Axios
- Date-fns
- Moment.js
- FilePond
- React Dropzone

### External Services:
- S3/MinIO (File Storage)
- SendGrid (Email)
- Twilio (SMS - опціонально)
- Firebase (Push - опціонально)
- Elasticsearch (Search)
- Sentry (Logging)

## Deliverables for Next Phase

### PHASE 2 – DATABASE ARCHITECT
1. ✅ DONE
2. ✅ DONE
3. ✅ DONE

### PHASE 3 – SECURITY ENGINEER
1. ✅ DONE
2. ✅ DONE
3. ✅ DONE

### PHASE 4 – BACKEND ENGINEER
1. ✅ DONE
2. ✅ DONE
3. ✅ DONE

### PHASE 5 – FRONTEND ENGINEER
1. ✅ DONE
2. ✅ DONE
3. ✅ DONE

### PHASE 6 – BILLING ENGINEER
1. ✅ DONE
2. ✅ DONE
3. ✅ DONE

### PHASE 7 – QA ENGINEER
1. ✅ DONE
2. ✅ DONE
3. ✅ DONE

### PHASE 8 – DEVOPS ENGINEER
1. ✅ DONE
2. ✅ DONE
3. ✅ DONE

### PHASE 9 – ENTERPRISE MODE
1. ✅ DONE
2. ✅ DONE
3. ✅ DONE

---

## READY FOR NEXT PHASE: CASES MODULE IMPLEMENTATION

**All prerequisites completed.**
- Database schema exists (Cases, Events, Documents entities defined)
- Security guards ready (TenantGuard, RbacGuard, SubscriptionGuard)
- Validation utilities (EDRPOU, INN, email, phone)
- Audit logging service for tracking
- Backend structure established (NestJS + TypeORM)
- Frontend hooks and Redux store ready

**Next Action:** Specify
```
NEXT MODULE: CASES
```

The system will then implement 9-phase development approach to create the Cases Module with full SaaS compliance.
