import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { RefreshTokenPayloadDto } from "../../../auth/dto/tokensPayload.dto";
import { SessionsRepository } from "../../infrastructure/sessions.repository";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";

export class DeleteAllOtherSessionCommand {
  constructor(public payload: RefreshTokenPayloadDto) {}
}

@CommandHandler(DeleteAllOtherSessionCommand)
export class DeleteAllOtherSessionCommandHandler
  implements ICommandHandler<DeleteAllOtherSessionCommand, void>
{
  constructor(private sessionsRepository: SessionsRepository) {}

  async execute({ payload }: DeleteAllOtherSessionCommand): Promise<void> {
    const currentUserSession =
      await this.sessionsRepository.findBy_userId_deviceId_version_pg({
        userId: payload.userId,
        deviceId: payload.deviceId,
        version: payload.version,
      });

    if (!currentUserSession) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: "Auth user session is invalid",
        extensions: [
          {
            field: "",
            message: "Auth user session is invalid",
          },
        ],
      });
    }

    await this.sessionsRepository.deleteAllOtherSessions_pg({
      userId: payload.userId,
      currentDeviceId: payload.deviceId,
    });
  }
}
