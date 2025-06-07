import {
  Inject,
  Injectable,
  CanActivate,
  ExecutionContext,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { RefreshTokenPayloadDto } from "../../auth/dto/tokensPayload.dto";
import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from "../../constants/auth-tokens.inject-constants";

@Injectable()
export class CookieJwtAuthGuard implements CanActivate {
  constructor(
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: "There is no cookie with refresh token",
        extensions: [
          {
            field: "",
            message: "There is no cookie with refresh token",
          },
        ],
      });
    }

    let payload: RefreshTokenPayloadDto;

    try {
      payload = this.refreshTokenContext.verify(refreshToken);
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: "Invalid refresh token in cookie",
        extensions: [
          {
            field: "",
            message: "Invalid refresh token in cookie",
          },
        ],
      });
    }

    req.payload = payload;

    return !!payload;
  }
}
