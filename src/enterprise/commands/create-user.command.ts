import { ICommand } from "@nestjs/cqrs";
import { UserRole } from "../../database/entities/enums/subscription.enum";

export class CreateUserCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly salt: string,
    public readonly role: UserRole,
  ) {}
}
