import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import {
  RefreshTokenInputDto,
  RefreshTokenOutputDto,
} from "../dto/refresh-token.dto";
import { TokenGenerationService } from "../tokenGeneration.service";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { SessionsRepository } from "../../../sessions/infrastructure/sessions.repository";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";

export class RefreshTokenCommand {
  constructor(public dto: RefreshTokenInputDto) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler
  implements ICommandHandler<RefreshTokenCommand, RefreshTokenOutputDto>
{
  constructor(
    private sessionsRepository: SessionsRepository,
    private tokenGenerationService: TokenGenerationService,
  ) {}

  async execute({ dto }: RefreshTokenCommand): Promise<RefreshTokenOutputDto> {
    const { payload, userAgent, ip } = dto;

    const session =
      await this.sessionsRepository.findBy_userId_deviceId_version({
        userId: payload.userId,
        deviceId: payload.deviceId,
        version: payload.version,
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

    const accessToken = this.tokenGenerationService.createAccessToken(
      payload.userId,
    );
    const refreshToken = this.tokenGenerationService.createRefreshToken({
      userId: payload.userId,
      deviceId: payload.deviceId,
    });

    session.update({ ip, userAgent, refreshToken });

    await this.sessionsRepository.save(session);

    return Promise.resolve({
      accessToken,
      refreshToken,
    });
  }
}
