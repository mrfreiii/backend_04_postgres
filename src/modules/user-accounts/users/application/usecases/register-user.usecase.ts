import { add } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { CommandBus, CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { CreateUserCommand } from "./create-user.usecase";
import { UsersRepository } from "../../infrastructure/users.repository";
import { EmailService } from "../../../../notifications/application/email.service";
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

    const user =
      await this.usersRepository.findOrNotFoundFail_pg(createdUserId);

    const confirmationCode = uuidv4();
    const codeExpirationDate = add(new Date(), {
      minutes: 2,
    }).getTime();

    await this.usersRepository.setRegistrationConfirmationCode_pg({
      userId: createdUserId,
      confirmationCode,
      codeExpirationDate,
    });

    this.emailService
      .sendEmailWithConfirmationCode({
        email: user.email,
        confirmationCode,
        currentURL,
      })
      .catch(console.error);
  }
}
