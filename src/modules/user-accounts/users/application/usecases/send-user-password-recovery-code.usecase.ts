import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { EmailService } from "../../../../notifications/application/email.service";
import { UsersRepository } from "../../infrastructure/users.repository";

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
  ) {}

  async execute({
    inputData,
  }: SendUserPasswordRecoveryCodeCommand): Promise<void> {
    const { email, currentURL } = inputData;

    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      return;
    }

    const recoveryCode = user.setPasswordRecoveryCode();
    await this.usersRepository.save(user);

    this.emailService
      .sendEmailWithPasswordRecoveryCode({
        email: user.email,
        recoveryCode,
        currentURL,
      })
      .catch(console.error);
  }
}
