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
    const passwordRecoveryInfo =
      await this.usersRepository.findPasswordRecoveryInfoByRecoveryCode_pg(
        dto.recoveryCode,
      );
    if (!passwordRecoveryInfo) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: "Invalid recovery code",
        extensions: [
          {
            field: "code",
            message: "Invalid recovery code",
          },
        ],
      });
    }

    if (passwordRecoveryInfo.codeExpirationDate < new Date().getTime()) {
      throw new DomainException({
        code: DomainExceptionCode.ConfirmationCodeExpired,
        message: "Recovery code expired",
        extensions: [
          {
            field: "code",
            message: "Recovery code expired",
          },
        ],
      });
    }

    const user = await this.usersRepository.findOrNotFoundFail_pg(
      passwordRecoveryInfo.userId,
    );

    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.newPassword,
    );

    await this.usersRepository.updateUserPassword_pg({
      userId: user.id,
      newPassword: passwordHash,
    });
  }
}
