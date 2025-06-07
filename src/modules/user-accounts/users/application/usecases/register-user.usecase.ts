import { CommandBus, CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { CreateUserCommand } from "./create-user.usecase";
import { EmailService } from "../../../../notifications/application/email.service";
import { UsersRepository } from "../../infrastructure/users.repository";
import { RegisterUserInputDto } from "../../../auth/api/input-dto/register-user.input-dto";

export class RegisterUserCommand {
  constructor(
    public inputData: {
      dto: RegisterUserInputDto;
      currentURL: string;
    },
  ) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserCommandHandler
  implements ICommandHandler<RegisterUserCommand, void>
{
  constructor(
    private usersRepository: UsersRepository,
    private commandBus: CommandBus,
    private emailService: EmailService,
  ) {}

  async execute({ inputData }: RegisterUserCommand): Promise<void> {
    const { dto, currentURL } = inputData;

    const createdUserId = await this.commandBus.execute(
      new CreateUserCommand(dto),
    );
    const user = await this.usersRepository.findOrNotFoundFail(createdUserId);

    const confirmationCode = user.setConfirmationCode();
    await this.usersRepository.save(user);

    this.emailService
      .sendEmailWithConfirmationCode({
        email: user.email,
        confirmationCode,
        currentURL,
      })
      .catch(console.error);
  }
}
