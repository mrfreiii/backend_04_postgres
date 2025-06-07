import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { RefreshTokenPayloadDto } from "../../dto/tokensPayload.dto";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { SessionsRepository } from "../../../sessions/infrastructure/sessions.repository";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";

export class LogoutUserCommand {
  constructor(public payload: RefreshTokenPayloadDto) {}
}

@CommandHandler(LogoutUserCommand)
export class LogoutUserCommandHandler
  implements ICommandHandler<LogoutUserCommand, void>
{
  constructor(private sessionsRepository: SessionsRepository) {}

  async execute({ payload }: LogoutUserCommand): Promise<void> {
    const { userId, deviceId, version } = payload;

    const session =
      await this.sessionsRepository.findBy_userId_deviceId_version({
        userId,
        deviceId,
        version,
      });

    if (!session) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: "Session is invalid",
        extensions: [
          {
            field: "",
            message: "Session is invalid",
          },
        ],
      });
    }

    const isSessionDeleted = await this.sessionsRepository.deleteSession({
      userId,
      deviceId,
    });
    if (!isSessionDeleted) {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Unable session deleting",
        extensions: [
          {
            field: "",
            message: "Unable session deleting",
          },
        ],
      });
    }
  }
}
