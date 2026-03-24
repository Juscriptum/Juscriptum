"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _trustverificationservice = require("./trust-verification.service");
const _trustverificationworkerservice = require("./trust-verification-worker.service");
describe("TrustVerificationWorkerService", ()=>{
    let service;
    let trustVerificationService;
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _trustverificationworkerservice.TrustVerificationWorkerService,
                {
                    provide: _trustverificationservice.TrustVerificationService,
                    useValue: {
                        processDueJobs: jest.fn()
                    }
                }
            ]
        }).compile();
        service = module.get(_trustverificationworkerservice.TrustVerificationWorkerService);
        trustVerificationService = module.get(_trustverificationservice.TrustVerificationService);
    });
    it("should process due trust verification jobs on schedule", async ()=>{
        trustVerificationService.processDueJobs.mockResolvedValue(2);
        await service.processPendingJobs();
        expect(trustVerificationService.processDueJobs).toHaveBeenCalled();
    });
});

//# sourceMappingURL=trust-verification-worker.service.spec.js.map