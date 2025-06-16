import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { UsersRepository } from "../../infrastructure/users.repository";
import { RegistrationEntity } from "../../domain/registration.entity.pg";
import { EmailService } from "../../../../notifications/application/email.service";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";

export class ResendUserRegistrationEmailCommand {
  constructor(
    public inputData: {
      email: string;
      currentURL: string;
    },
  ) {}
}

@CommandHandler(ResendUserRegistrationEmailCommand)
export class ResendUserRegistrationEmailCommandHandler
  implements ICommandHandler<ResendUserRegistrationEmailCommand, void>
{
  constructor(
    private usersRepository: UsersRepository,
    private emailService: EmailService,
    private registrationEntity: RegistrationEntity,
  ) {}

  async execute({
    inputData,
  }: ResendUserRegistrationEmailCommand): Promise<void> {
    const { email, currentURL } = inputData;

    const user = await this.usersRepository.findByEmail_pg(email);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: "User not found",
        extensions: [
          {
            field: "email",
            message: "User not found",
          },
        ],
      });
    }

    if (user.isEmailConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: "Email already confirmed",
        extensions: [
          {
            field: "email",
            message: "Email already confirmed",
          },
        ],
      });
    }

    const registrationInfo = this.registrationEntity.createInstance(user.id);

    await this.usersRepository.updateRegistrationConfirmationCode_pg(
      registrationInfo,
    );

    this.emailService
      .sendEmailWithConfirmationCode({
        email: user.email,
        confirmationCode: registrationInfo.confirmationCode,
        currentURL,
      })
      .catch(console.error);
  }
}
