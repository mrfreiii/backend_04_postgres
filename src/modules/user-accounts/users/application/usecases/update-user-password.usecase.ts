import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { CryptoService } from "../crypto.service";
import { UsersRepository } from "../../infrastructure/users.repository";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";
import { UpdatePasswordInputDto } from "../../../auth/api/input-dto/update-password.input-dto";

export class UpdateUserPasswordCommand {
  constructor(public dto: UpdatePasswordInputDto) {}
}

@CommandHandler(UpdateUserPasswordCommand)
export class UpdateUserPasswordCommandHandler
  implements ICommandHandler<UpdateUserPasswordCommand, void>
{
  constructor(
    private usersRepository: UsersRepository,
    private cryptoService: CryptoService,
  ) {}

  async execute({ dto }: UpdateUserPasswordCommand): Promise<void> {
    const user = await this.usersRepository.findByPasswordRecoveryCode(
      dto.recoveryCode,
    );
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: "Invalid recovery code",
        extensions: [
          {
            field: "recoveryCode",
            message: "Invalid recovery code",
          },
        ],
      });
    }

    if (user.passwordRecoveryCodeExpirationDate < new Date().getTime()) {
      throw new DomainException({
        code: DomainExceptionCode.ConfirmationCodeExpired,
        message: "Recovery code expired",
        extensions: [
          {
            field: "recoveryCode",
            message: "Code expired",
          },
        ],
      });
    }

    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.newPassword,
    );

    user.updatePassword(passwordHash);

    await this.usersRepository.save(user);
  }
}
