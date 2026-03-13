import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { CreateUserCommand } from "../create-user.command";
import { User } from "../../../database/entities/User.entity";
import { UserStatus } from "../../../database/entities/enums/subscription.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserCreatedEvent, AuditLogEvent } from "../../events/user.events";

/**
 * Create User Command Handler
 * Handles user creation in the write model
 */
@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    // Create user in write model
    const user: User = this.userRepository.create({
      tenantId: command.tenantId,
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      passwordHash: command.passwordHash,
      salt: command.salt,
      role: command.role,
      status: UserStatus.ACTIVE,
    });

    const savedUser: User = await this.userRepository.save(user);

    // Publish event for read model update
    this.eventBus.publish(
      new UserCreatedEvent(
        savedUser.id,
        savedUser.tenantId,
        savedUser.firstName,
        savedUser.lastName,
        savedUser.email,
        savedUser.role,
        savedUser.createdAt,
      ),
    );

    // Publish event for audit logging
    this.eventBus.publish(
      new AuditLogEvent(
        savedUser.tenantId,
        "create",
        "User",
        savedUser.id,
        new Date(),
        savedUser.id,
        savedUser,
      ),
    );

    return savedUser;
  }
}
