import { CommandBus, CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { CreateUserCommand } from "./create-user.usecase";
import { UsersRepository } from "../../infrastructure/users.repository";
import { RegistrationEntity } from "../../domain/registration.entity.pg";
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
    private registrationEntity: RegistrationEntity,
  ) {}

  async execute({ inputData }: RegisterUserCommand): Promise<void> {
    const { dto, currentURL } = inputData;
    const createdUserId = await this.commandBus.execute(
      new CreateUserCommand(dto),
    );

    const user =
      await this.usersRepository.findOrNotFoundFail_pg(createdUserId);

    const registrationInfo =
      this.registrationEntity.createInstance(createdUserId);

    await this.usersRepository.setRegistrationConfirmationCode_pg(
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
