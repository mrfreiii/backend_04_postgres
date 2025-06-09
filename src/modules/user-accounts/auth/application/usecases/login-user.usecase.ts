import { v4 as uuidv4 } from "uuid";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { TokenGenerationService } from "../tokenGeneration.service";
import { SessionEntity } from "../../../sessions/domain/session.entity.pg";
import { LoginUserInputDto, LoginUserOutputDto } from "../dto/login-user.dto";
import { SessionsRepository } from "../../../sessions/infrastructure/sessions.repository";

export class LoginUserCommand {
  constructor(public dto: LoginUserInputDto) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserCommandHandler
  implements ICommandHandler<LoginUserCommand, LoginUserOutputDto>
{
  constructor(
    private sessionsRepository: SessionsRepository,
    private tokenGenerationService: TokenGenerationService,
    private sessionEntity: SessionEntity,
  ) {}

  async execute({ dto }: LoginUserCommand): Promise<LoginUserOutputDto> {
    const { userId, userAgent, ip } = dto;
    const deviceId = uuidv4();

    const accessToken = this.tokenGenerationService.createAccessToken(userId);
    const refreshToken = this.tokenGenerationService.createRefreshToken({
      userId,
      deviceId,
    });

    const session = this.sessionEntity.createInstance({
      userId,
      deviceId,
      userAgent,
      ip,
      refreshToken,
    });
    await this.sessionsRepository.createSession_pg(session);

    return Promise.resolve({
      accessToken,
      refreshToken,
    });
  }
}
