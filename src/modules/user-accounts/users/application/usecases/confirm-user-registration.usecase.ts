import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { UsersRepository } from "../../infrastructure/users.repository";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";

export class ConfirmUserRegistrationCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmUserRegistrationCommand)
export class ConfirmUserRegistrationCommandHandler
  implements ICommandHandler<ConfirmUserRegistrationCommand, void>
{
  constructor(private usersRepository: UsersRepository) {}

  async execute({ code }: ConfirmUserRegistrationCommand): Promise<void> {
    const registrationInfo =
      await this.usersRepository.findRegistrationInfoByConfirmationCode_pg(
        code,
      );
    if (!registrationInfo) {
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

    if (registrationInfo.codeExpirationDate < new Date().getTime()) {
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

    const user = await this.usersRepository.findOrNotFoundFail_pg(
      registrationInfo.userId,
    );
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

    await this.usersRepository.confirmUserRegistration_pg(
      registrationInfo.userId,
    );
  }
}
