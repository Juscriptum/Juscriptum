# Client Management Module Design Document

> LAW Organizer - Enterprise Legal CRM SaaS Platform

**Date:** 2026-02-27
**Author:** Edhar Simonian
**Status:** Approved for Implementation

---

## Executive Summary

This document defines the architecture and implementation design for the Client Management Module in LAW Organizer. The module provides a tab-based form interface for managing three client types: Individual (Фізична особа), Sole Proprietor (ФОП), and Legal Entity (Юридична особа).

---

## 1. Architecture Overview

### 1.1 Database Strategy

**Decision:** Single Table + JSONB

**Rationale:**
- Flexible schema for type-specific fields
- Simpler queries with GIN index on metadata
- Supports future client types without schema migration
- Tenant isolation via `tenant_id` discriminator

### 1.2 Component Architecture

```
src/
├── database/entities/
│   └── Client.entity.ts          # Extended with JSONB metadata
├── clients/
│   ├── dto/
│   │   ├── create-client.dto.ts  # Polymorphic DTO
│   │   └── client.types.ts       # Type definitions
│   ├── services/
│   │   └── client.service.ts
│   └── controllers/
│       └── clients.controller.ts
├── frontend/
│   ├── pages/clients/
│   │   ├── ClientsPage.tsx       # List view
│   │   ├── AddClientPage.tsx     # Form container
│   │   └── components/
│   │       ├── ClientTypeTabs.tsx
│   │       ├── ClientFilterCard.tsx
│   │       ├── ClientsTable.tsx
│   │       ├── sections/
│   │       │   ├── PersonalInfoSection.tsx
│   │       │   ├── ContactSection.tsx
│   │       │   ├── AddressSection.tsx
│   │       │   ├── BankingSection.tsx
│   │       │   └── DirectorSection.tsx
│   │       └── ClientFormActions.tsx
│   ├── hooks/
│   │   └── useClientForm.ts
│   └── schemas/
│       └── client.schema.ts
```

---

## 2. Database Schema

### 2.1 Entity Definition

```typescript
export enum ClientType {
  INDIVIDUAL = 'individual',
  FOP = 'fop',
  LEGAL_ENTITY = 'legal_entity'
}

@Entity('clients')
export class Client extends BaseEntity {
  @PrimaryGeneratedUUID()
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'enum', enum: ClientType, default: ClientType.INDIVIDUAL })
  client_type: ClientType;

  @Column({ nullable: true })
  client_number: string;

  @Column({ type: 'date' })
  registration_date: string;

  @Column({ type: 'jsonb', default: {} })
  addresses: AddressData;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: ClientMetadata;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
```

### 2.2 Type Definitions

```typescript
interface AddressData {
  registration: Address;
  actual?: Address;
  is_same_address: boolean;
}

interface Address {
  region: string;
  city: string;
  city_code?: string;
  street: string;
  building: string;
  apartment?: string;
}

interface ContactData {
  phone: string;
  additional_phones?: string[];
  email: string;
  additional_emails?: string[];
  messengers?: {
    whatsapp?: string;
    viber?: string;
    skype?: string;
    telegram?: string;
  };
}

type ClientMetadata = IndividualMetadata | FopMetadata | LegalEntityMetadata;

interface IndividualMetadata extends ContactData {
  first_name: string;
  last_name: string;
  middle_name: string;
  inn?: string;
  passport_series?: string;
  passport_number?: string;
  birth_date?: string;
}

interface FopMetadata extends IndividualMetadata {
  taxation_authority: string;
  taxation_basis: string;
  banking: BankingRequisites;
  director: DirectorInfo;
}

interface LegalEntityMetadata {
  company_form: string;
  company_name: string;
  edrpou: string;
  taxation_form: string;
  contact_person: ContactPerson;
  director: DirectorInfo;
  banking: BankingRequisites;
}

interface BankingRequisites {
  bank_name: string;
  mfo: string;
  iban: string;
}

interface DirectorInfo {
  is_same_as_client: boolean;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  position?: string;
  taxation_basis?: string;
}
```

### 2.3 Validation Constraints

| Field | Format | Pattern |
|-------|--------|---------|
| inn | 10 digits | `^\d{10}$` |
| edrpou | 8 digits | `^\d{8}$` |
| phone | +380XXXXXXXXX | `^\+380\d{9}$` |
| mfo | 6 digits | `^\d{6}$` |
| iban | UA + 27 digits | `^UA\d{27}$` |

### 2.4 Required Indexes

```sql
CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_clients_tenant_type ON clients(tenant_id, client_type);
CREATE INDEX idx_clients_metadata_gin ON clients USING GIN(metadata);
CREATE INDEX idx_clients_deleted_at ON clients(deleted_at) WHERE deleted_at IS NULL;
```

---

## 3. Backend Architecture

### 3.1 Polymorphic DTO

The `CreateClientDto` uses conditional validation based on `client_type`:

- `individual_metadata` validated when `client_type = 'individual'`
- `fop_metadata` validated when `client_type = 'fop'`
- `legal_entity_metadata` validated when `client_type = 'legal_entity'`

### 3.2 Service Layer

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `create(tenantId, dto)` | Create client with auto-generated number |
| `findAll(tenantId, query)` | Paginated list with filters and JSONB search |
| `findOne(tenantId, id)` | Single client retrieval |
| `update(tenantId, id, dto)` | Update with audit logging |
| `softDelete(tenantId, id)` | Soft delete via `deleted_at` |

### 3.3 Security Enforcement

| Layer | Enforcement |
|-------|-------------|
| Controller | `@Roles('lawyer', 'organization_admin', 'organization_owner')` |
| TenantGuard | Validates `tenant_id` from JWT |
| Service | All queries filtered by `tenantId` |
| Audit | All mutations logged with tenant context |

---

## 4. Frontend Architecture

### 4.1 Form State Management

**Hook:** `useClientForm`

**Features:**
- Tab-aware form initialization
- Shared field preservation on tab switch
- Nested field updates via path notation
- Zod schema validation per client type
- Submit with redirect options

### 4.2 Tab Component

Three tabs with visual active state:
1. Фізична особа (Individual)
2. ФОП (Sole Proprietor)
3. Юридична особа (Legal Entity)

Active tab: orange background tint, orange border, checkmark icon

### 4.3 Address Section Logic

**Sync Toggle:**
- When checked: `actual` address mirrors `registration`
- When checked: actual address fields disabled with `opacity-50`
- On uncheck: actual address fields enabled for editing

### 4.4 Save Actions

| Button | Behavior |
|--------|----------|
| Пошук у реєстрі боржників | External API lookup (future) |
| Зберегти дані клієнта | Save → redirect to `/clients` |
| Зберегти та додати справу | Save → redirect to `/cases/add?client_id=X` |

---

## 5. List Page Components

### 5.1 Filter Card

**Filters:**
- Client type dropdown
- Date range picker
- Search field selector
- Search query input

### 5.2 Clients Table

**Columns:**
1. № п/п (sortable)
2. ПІБ/Найменування (sortable)
3. Телефон
4. E-mail
5. Адреса реєстрації
6. Дата (sortable)
7. Actions (kebab menu)

**Pagination:**
- Limit selector (10/25/50/100)
- Page numbers with active state
- Next/Previous navigation

---

## 6. Error Handling

### 6.1 Error Scenarios

| Scenario | Frontend | Backend |
|----------|----------|---------|
| Validation Error | Inline errors | 400 |
| Duplicate INN/EDRPOU | Toast notification | 409 |
| Network Failure | Retry + cached data | N/A |
| Unauthorized | Redirect to login | 401 |
| Forbidden | Upgrade prompt | 403 |
| Tenant Mismatch | Clear state, redirect | 403 |

### 6.2 Silent Failure Prevention

| Risk | Mitigation |
|------|------------|
| Address sync not persisted | Validate `actual` matches `registration` |
| Tab switch data loss | React state (not URL params) |
| Validation bypass | Server-side enforcement |
| Empty metadata | Schema `.required()` |

---

## 7. Testing Strategy

### 7.1 Unit Tests

- `useClientForm`: Tab switch preservation, validation, submit
- `AddressSection`: Sync toggle, disabled state
- `ClientTypeTabs`: Active state, callbacks
- `ClientsTable`: Pagination, sort, actions

### 7.2 Integration Tests

- Create flow for each client type
- Save + Add Case redirect
- Address sync behavior
- Filter + Search functionality

### 7.3 E2E Tests

- Full CRUD cycle
- RBAC enforcement
- Pagination navigation
- Validation error display

---

## 8. Implementation Phases

### Phase 1: Database & Backend (Days 1-2)
- Extend Client entity with JSONB metadata
- Create polymorphic DTOs with validation
- Implement service methods
- Add controller endpoints
- Write unit tests

### Phase 2: Frontend Core (Days 3-4)
- Create AddClientPage container
- Implement ClientTypeTabs
- Build shared form sections
- Create useClientForm hook
- Add Zod validation schemas

### Phase 3: Frontend Features (Days 5-6)
- Implement type-specific sections
- Build AddressSection with sync logic
- Create ClientFormActions
- Add loading states and skeletons

### Phase 4: List Page (Day 7)
- Build ClientFilterCard
- Implement ClientsTable with pagination
- Add sorting and search
- Connect to API

### Phase 5: Integration (Day 8)
- Connect all components
- E2E testing
- Performance optimization
- Documentation

---

## 9. Security Checklist

- [x] JWT authentication required
- [x] Tenant isolation via guards
- [x] RBAC role checking
- [x] Server-side validation
- [x] SQL injection protection (TypeORM)
- [x] XSS protection (validation)
- [x] Audit logging
- [ ] PII encryption at rest (TODO)
- [ ] Row Level Security (TODO)

---

## 10. Known Limitations

1. **Multi-address**: Only registration + actual address supported (future: unlimited addresses)
2. **Debtor registry**: External API integration not yet implemented
3. **File attachments**: Document upload per client not included in this phase
4. **Activity timeline**: Client interaction history not implemented

---

## 11. Future Enhancements

- PII encryption for INN, passport data
- Row Level Security for production
- Client document attachments
- Activity/interaction timeline
- Bulk import from CSV
- Client portal access
- Integration with court registries

---

## Approval

This design document has been reviewed and approved for implementation.

**Next Step:** Invoke `writing-plans` skill to generate detailed implementation plan.

---

> Generated: 2026-02-27
> Version: 1.0.0
