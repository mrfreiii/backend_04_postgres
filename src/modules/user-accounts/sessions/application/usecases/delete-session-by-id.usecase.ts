import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { DeleteSessionByIdInputDto } from "../dto/delete-session-by-id.dto";
import { SessionsRepository } from "../../infrastructure/sessions.repository";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";

export class DeleteSessionByIdCommand {
  constructor(public dto: DeleteSessionByIdInputDto) {}
}

@CommandHandler(DeleteSessionByIdCommand)
export class DeleteSessionByIdCommandHandler
  implements ICommandHandler<DeleteSessionByIdCommand, void>
{
  constructor(private sessionsRepository: SessionsRepository) {}

  async execute({ dto }: DeleteSessionByIdCommand): Promise<void> {
    const { deviceIdFromQueryParam, payload } = dto;

    const currentUserSession =
      await this.sessionsRepository.findBy_userId_deviceId_version({
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

    const sessionForDeletion = await this.sessionsRepository.findByDeviceId(
      deviceIdFromQueryParam,
    );
    if (!sessionForDeletion) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Session not found",
        extensions: [
          {
            field: "",
            message: "Session not found",
          },
        ],
      });
    }

    if (payload.userId !== sessionForDeletion.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: "Forbidden deleting session of another user",
        extensions: [
          {
            field: "",
            message: "Forbidden deleting session of another user",
          },
        ],
      });
    }

    const isSessionDeleted = await this.sessionsRepository.deleteSession({
      userId: sessionForDeletion.userId,
      deviceId: sessionForDeletion.deviceId,
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
