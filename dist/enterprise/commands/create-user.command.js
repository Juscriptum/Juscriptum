"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreateUserCommand", {
    enumerable: true,
    get: function() {
        return CreateUserCommand;
    }
});
let CreateUserCommand = class CreateUserCommand {
    constructor(tenantId, firstName, lastName, email, passwordHash, salt, role){
        this.tenantId = tenantId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.salt = salt;
        this.role = role;
    }
};

//# sourceMappingURL=create-user.command.js.map