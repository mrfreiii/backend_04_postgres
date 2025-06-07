import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import {
  DomainExceptionCode,
} from "../../../../../core/exceptions/domain-exception-codes";
import { UsersRepository } from "../../infrastructure/users.repository";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";

export class ConfirmUserRegistrationCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmUserRegistrationCommand)
export class ConfirmUserRegistrationCommandHandler
  implements ICommandHandler<ConfirmUserRegistrationCommand, void>
{
  constructor(
    private usersRepository: UsersRepository,
  ) {}

  async execute({ code }: ConfirmUserRegistrationCommand): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(code);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: "Invalid confirmation code",
        extensions: [
          {
            field: "code",
            message: "Invalid confirmation code",
          },
        ],
      });
    }

    if (user.isEmailConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: "User registration already confirmed",
        extensions: [
          {
            field: "code",
            message: "User already confirmed",
          },
        ],
      });
    }

    if (user.confirmationCodeExpirationDate < new Date().getTime()) {
      throw new DomainException({
        code: DomainExceptionCode.ConfirmationCodeExpired,
        message: "Confirmation code expired",
        extensions: [
          {
            field: "code",
            message: "Confirmation code expired",
          },
        ],
      });
    }

    user.confirmRegistration();
    await this.usersRepository.save(user);
  }
}
