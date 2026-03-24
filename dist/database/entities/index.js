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
    get AuditLog () {
        return _AuditLogentity.AuditLog;
    },
    get Calculation () {
        return _Calculationentity.Calculation;
    },
    get CalculationItem () {
        return _CalculationItementity.CalculationItem;
    },
    get Case () {
        return _Caseentity.Case;
    },
    get Client () {
        return _Cliententity.Client;
    },
    get ClientNumberRelease () {
        return _ClientNumberReleaseentity.ClientNumberRelease;
    },
    get DATABASE_ENTITIES () {
        return DATABASE_ENTITIES;
    },
    get Document () {
        return _Documententity.Document;
    },
    get DocumentProcessingArtifact () {
        return _DocumentProcessingArtifactentity.DocumentProcessingArtifact;
    },
    get DocumentProcessingJob () {
        return _DocumentProcessingJobentity.DocumentProcessingJob;
    },
    get DocumentSignature () {
        return _DocumentSignatureentity.DocumentSignature;
    },
    get Event () {
        return _Evententity.Event;
    },
    get FileScanRecord () {
        return _FileScanRecordentity.FileScanRecord;
    },
    get Invitation () {
        return _Invitationentity.Invitation;
    },
    get Invoice () {
        return _Invoiceentity.Invoice;
    },
    get Note () {
        return _Noteentity.Note;
    },
    get Notification () {
        return _Notificationentity.Notification;
    },
    get OnboardingProgress () {
        return _OnboardingProgressentity.OnboardingProgress;
    },
    get Organization () {
        return _Organizationentity.Organization;
    },
    get PasswordReset () {
        return _PasswordResetentity.PasswordReset;
    },
    get PlatformAdminRefreshToken () {
        return _PlatformAdminRefreshTokenentity.PlatformAdminRefreshToken;
    },
    get PlatformAdminRevokedAccessToken () {
        return _PlatformAdminRevokedAccessTokenentity.PlatformAdminRevokedAccessToken;
    },
    get PlatformAdminUser () {
        return _PlatformAdminUserentity.PlatformAdminUser;
    },
    get Pricelist () {
        return _Pricelistentity.Pricelist;
    },
    get PricelistCategory () {
        return _PricelistCategoryentity.PricelistCategory;
    },
    get PricelistItem () {
        return _PricelistItementity.PricelistItem;
    },
    get RefreshToken () {
        return _RefreshTokenentity.RefreshToken;
    },
    get RevokedAccessToken () {
        return _RevokedAccessTokenentity.RevokedAccessToken;
    },
    get ScanPage () {
        return _ScanPageentity.ScanPage;
    },
    get ScanSession () {
        return _ScanSessionentity.ScanSession;
    },
    get Subscription () {
        return _Subscriptionentity.Subscription;
    },
    get TrustVerificationJob () {
        return _TrustVerificationJobentity.TrustVerificationJob;
    },
    get User () {
        return _Userentity.User;
    },
    get UserIdentity () {
        return _UserIdentityentity.UserIdentity;
    }
});
const _Organizationentity = require("./Organization.entity");
const _PlatformAdminUserentity = require("./PlatformAdminUser.entity");
const _PlatformAdminRefreshTokenentity = require("./PlatformAdminRefreshToken.entity");
const _PlatformAdminRevokedAccessTokenentity = require("./PlatformAdminRevokedAccessToken.entity");
const _Userentity = require("./User.entity");
const _UserIdentityentity = require("./UserIdentity.entity");
const _RefreshTokenentity = require("./RefreshToken.entity");
const _RevokedAccessTokenentity = require("./RevokedAccessToken.entity");
const _PasswordResetentity = require("./PasswordReset.entity");
const _Subscriptionentity = require("./Subscription.entity");
const _Invitationentity = require("./Invitation.entity");
const _OnboardingProgressentity = require("./OnboardingProgress.entity");
const _AuditLogentity = require("./AuditLog.entity");
const _Cliententity = require("./Client.entity");
const _ClientNumberReleaseentity = require("./ClientNumberRelease.entity");
const _Caseentity = require("./Case.entity");
const _Documententity = require("./Document.entity");
const _DocumentProcessingJobentity = require("./DocumentProcessingJob.entity");
const _DocumentProcessingArtifactentity = require("./DocumentProcessingArtifact.entity");
const _DocumentSignatureentity = require("./DocumentSignature.entity");
const _FileScanRecordentity = require("./FileScanRecord.entity");
const _ScanSessionentity = require("./ScanSession.entity");
const _ScanPageentity = require("./ScanPage.entity");
const _Evententity = require("./Event.entity");
const _Noteentity = require("./Note.entity");
const _Pricelistentity = require("./Pricelist.entity");
const _PricelistCategoryentity = require("./PricelistCategory.entity");
const _PricelistItementity = require("./PricelistItem.entity");
const _Calculationentity = require("./Calculation.entity");
const _CalculationItementity = require("./CalculationItem.entity");
const _Invoiceentity = require("./Invoice.entity");
const _Notificationentity = require("./Notification.entity");
const _TrustVerificationJobentity = require("./TrustVerificationJob.entity");
_export_star(require("./enums/subscription.enum"), exports);
_export_star(require("./enums/platform-admin.enum"), exports);
_export_star(require("./enums/notification-types.enum"), exports);
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}
const DATABASE_ENTITIES = [
    _AuditLogentity.AuditLog,
    _Calculationentity.Calculation,
    _CalculationItementity.CalculationItem,
    _Caseentity.Case,
    _Cliententity.Client,
    _ClientNumberReleaseentity.ClientNumberRelease,
    _Documententity.Document,
    _DocumentProcessingArtifactentity.DocumentProcessingArtifact,
    _DocumentProcessingJobentity.DocumentProcessingJob,
    _DocumentSignatureentity.DocumentSignature,
    _Evententity.Event,
    _FileScanRecordentity.FileScanRecord,
    _Invitationentity.Invitation,
    _Invoiceentity.Invoice,
    _Noteentity.Note,
    _Notificationentity.Notification,
    _OnboardingProgressentity.OnboardingProgress,
    _Organizationentity.Organization,
    _PasswordResetentity.PasswordReset,
    _PlatformAdminRefreshTokenentity.PlatformAdminRefreshToken,
    _PlatformAdminRevokedAccessTokenentity.PlatformAdminRevokedAccessToken,
    _PlatformAdminUserentity.PlatformAdminUser,
    _Pricelistentity.Pricelist,
    _PricelistCategoryentity.PricelistCategory,
    _PricelistItementity.PricelistItem,
    _RefreshTokenentity.RefreshToken,
    _RevokedAccessTokenentity.RevokedAccessToken,
    _ScanPageentity.ScanPage,
    _ScanSessionentity.ScanSession,
    _Subscriptionentity.Subscription,
    _TrustVerificationJobentity.TrustVerificationJob,
    _Userentity.User,
    _UserIdentityentity.UserIdentity
];

//# sourceMappingURL=index.js.map