import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { UserContextDto } from "../../../guards/dto/user-context.dto";
import { CryptoService } from "../../../users/application/crypto.service";
import { LoginUserInputDto } from "../../api/input-dto/login -user.input-dto";
import { UsersRepository } from "../../../users/infrastructure/users.repository";

export class ValidateUserCommand {
  constructor(public dto: LoginUserInputDto) {}
}

@CommandHandler(ValidateUserCommand)
export class ValidateUserCommandHandler
  implements ICommandHandler<ValidateUserCommand, UserContextDto | null>
{
  constructor(
    private usersRepository: UsersRepository,
    private cryptoService: CryptoService,
  ) {}

  async execute({ dto }: ValidateUserCommand): Promise<UserContextDto | null> {
    const user = await this.usersRepository.findByLoginOrEmail({
      login: dto.loginOrEmail,
      email: dto.loginOrEmail,
    });
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.cryptoService.comparePasswords({
      password: dto.password,
      hash: user.passwordHash,
    });
    if (!isPasswordValid) {
      return null;
    }

    return { id: user.id.toString() };
  }
}
