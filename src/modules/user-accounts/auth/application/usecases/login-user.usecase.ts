import { v4 as uuidv4 } from "uuid";
import { InjectModel } from "@nestjs/mongoose";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import {
  Session,
  SessionModelType,
} from "../../../sessions/domain/session.entity";
import { TokenGenerationService } from "../tokenGeneration.service";
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
    @InjectModel(Session.name) private SessionModel: SessionModelType,
    private sessionsRepository: SessionsRepository,
    private tokenGenerationService: TokenGenerationService,
  ) {}

  async execute({ dto }: LoginUserCommand): Promise<LoginUserOutputDto> {
    const { userId, userAgent, ip } = dto;
    const deviceId = uuidv4();

    const accessToken = this.tokenGenerationService.createAccessToken(userId);
    const refreshToken = this.tokenGenerationService.createRefreshToken({
      userId,
      deviceId,
    });

    const session = this.SessionModel.createInstance({
      userId,
      deviceId,
      userAgent,
      ip,
      refreshToken,
    });
    await this.sessionsRepository.save(session);

    return Promise.resolve({
      accessToken,
      refreshToken,
    });
  }
}
