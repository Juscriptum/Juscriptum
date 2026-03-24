"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _auditservice = require("./audit.service");
const _AuditLogentity = require("../../database/entities/AuditLog.entity");
describe("AuditService", ()=>{
    let service;
    let auditLogRepository;
    let dataSource;
    beforeEach(async ()=>{
        auditLogRepository = {
            create: jest.fn((payload)=>payload),
            save: jest.fn(),
            createQueryBuilder: jest.fn()
        };
        dataSource = {
            options: {
                type: "postgres"
            },
            createQueryRunner: jest.fn().mockReturnValue({
                connect: jest.fn(),
                query: jest.fn(),
                release: jest.fn(),
                manager: {
                    save: jest.fn()
                }
            })
        };
        const module = await _testing.Test.createTestingModule({
            providers: [
                _auditservice.AuditService,
                {
                    provide: (0, _typeorm.getRepositoryToken)(_AuditLogentity.AuditLog),
                    useValue: auditLogRepository
                },
                {
                    provide: _typeorm1.DataSource,
                    useValue: dataSource
                }
            ]
        }).compile();
        service = module.get(_auditservice.AuditService);
    });
    it("should save audit logs through an explicit postgres RLS context", async ()=>{
        const queryRunner = dataSource.createQueryRunner();
        await service.log({
            tenantId: "tenant-1",
            userId: "user-1",
            action: "create",
            entityType: "Organization",
            entityId: "org-1"
        });
        expect(queryRunner.query).toHaveBeenCalledWith(expect.stringContaining("set_config('app.current_tenant_id'"), [
            "tenant-1",
            "user-1",
            "system"
        ]);
        expect(queryRunner.manager.save).toHaveBeenCalledWith(_AuditLogentity.AuditLog, expect.objectContaining({
            tenantId: "tenant-1",
            userId: "user-1",
            entityType: "Organization"
        }));
        expect(auditLogRepository.save).not.toHaveBeenCalled();
    });
    it("should redact PII in audit payloads before persistence", async ()=>{
        const queryRunner = dataSource.createQueryRunner();
        await service.log({
            tenantId: "tenant-1",
            userId: "user-1",
            action: "update",
            entityType: "Client",
            entityId: "client-1",
            oldValues: {
                email: "old@example.com",
                passportNumber: "AB123456"
            },
            newValues: {
                phone: "+380501234567",
                notes: "visible note"
            },
            metadata: {
                secondaryPhone: "+380671234567"
            }
        });
        expect(queryRunner.manager.save).toHaveBeenCalledWith(_AuditLogentity.AuditLog, expect.objectContaining({
            oldValues: {
                email: "[REDACTED]",
                passportNumber: "[REDACTED]"
            },
            newValues: {
                phone: "[REDACTED]",
                notes: "visible note"
            },
            metadata: {
                secondaryPhone: "[REDACTED]"
            }
        }));
    });
    it("should use the repository path outside postgres", async ()=>{
        dataSource.options.type = "better-sqlite3";
        auditLogRepository.save.mockResolvedValue(undefined);
        await service.log({
            tenantId: "tenant-1",
            action: "create",
            entityType: "Organization"
        });
        expect(auditLogRepository.save).toHaveBeenCalled();
    });
});

//# sourceMappingURL=audit.service.spec.js.map