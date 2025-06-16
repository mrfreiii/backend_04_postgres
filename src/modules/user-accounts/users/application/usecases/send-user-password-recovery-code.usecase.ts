import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { UsersRepository } from "../../infrastructure/users.repository";
import { PasswordRecoveryEntity } from "../../domain/passwordRecovery.entity.pg";
import { EmailService } from "../../../../notifications/application/email.service";

export class SendUserPasswordRecoveryCodeCommand {
  constructor(
    public inputData: {
      email: string;
      currentURL: string;
    },
  ) {}
}

@CommandHandler(SendUserPasswordRecoveryCodeCommand)
export class SendUserPasswordRecoveryCodeCommandHandler
  implements ICommandHandler<SendUserPasswordRecoveryCodeCommand, void>
{
  constructor(
    private usersRepository: UsersRepository,
    private emailService: EmailService,
    private passwordRecoveryEntity: PasswordRecoveryEntity,
  ) {}

  async execute({
    inputData,
  }: SendUserPasswordRecoveryCodeCommand): Promise<void> {
    const { email, currentURL } = inputData;

    const user = await this.usersRepository.findByEmail_pg(email);
    if (!user) {
      return;
    }

    const recoveryInfo = this.passwordRecoveryEntity.createInstance(user.id);
    await this.usersRepository.setPasswordRecoveryCode_pg(recoveryInfo);

    this.emailService
      .sendEmailWithPasswordRecoveryCode({
        email: user.email,
        recoveryCode: recoveryInfo.recoveryCode,
        currentURL,
      })
      .catch(console.error);
  }
}
