import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import {
  AccessTokenPayloadDto,
  RefreshTokenPayloadDto,
} from "../dto/tokensPayload.dto";
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from "../../constants/auth-tokens.inject-constants";

@Injectable()
export class TokenGenerationService {
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
  ) {}

  createAccessToken(userId: string): string {
    const accessTokenPayload: AccessTokenPayloadDto = {
      id: userId,
    };

    return this.accessTokenContext.sign(accessTokenPayload);
  }

  createRefreshToken(dto: { userId: string; deviceId: string }): string {
    const refreshTokenPayload: RefreshTokenPayloadDto = {
      userId: dto.userId,
      deviceId: dto.deviceId,
      version: new Date().getTime(),
    };

    return this.refreshTokenContext.sign(refreshTokenPayload);
  }
}
