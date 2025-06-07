import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Request, Response } from "express";
import { ApiBearerAuth } from "@nestjs/swagger";

import { JwtAuthGuard } from "../../guards/bearer/jwt-auth.guard";
import { LocalAuthGuard } from "../../guards/local/local-auth.guard";
import { CookieJwtAuthGuard } from "../../guards/bearer/cookie-jwt-auth.guard";

import { RefreshTokenPayloadDto } from "../dto/tokensPayload.dto";
import { UserContextDto } from "../../guards/dto/user-context.dto";
import { MeViewDto } from "../../users/api/view-dto/users.view-dto";
import { RegisterUserInputDto } from "./input-dto/register-user.input-dto";
import { UpdatePasswordInputDto } from "./input-dto/update-password.input-dto";
import { ConfirmUserRegistrationInputDto } from "./input-dto/confirm-user-registration.input-dto";
import { SendPasswordRecoveryCodeInputDto } from "./input-dto/send-password-recovery-code.input-dto";
import { ResendUserRegistrationEmailInputDto } from "./input-dto/resend-user-registration-email.input-dto";

import { LoginUserCommand } from "../application/usecases/login-user.usecase";
import { LogoutUserCommand } from "../application/usecases/logout-user.usecase";
import { RefreshTokenCommand } from "../application/usecases/refresh-token.usecase";
import { RegisterUserCommand } from "../../users/application/usecases/register-user.usecase";
import { UpdateUserPasswordCommand } from "../../users/application/usecases/update-user-password.usecase";
import { ConfirmUserRegistrationCommand } from "../../users/application/usecases/confirm-user-registration.usecase";
import { ResendUserRegistrationEmailCommand } from "../../users/application/usecases/resend-user-registration-email.usecase";
import { SendUserPasswordRecoveryCodeCommand } from "../../users/application/usecases/send-user-password-recovery-code.usecase";

import { SETTINGS } from "../../../../settings";
import { AuthQueryRepository } from "../infrastructure/query/auth.query-repository";
import { ExtractUserFromRequest } from "../../guards/decorators/param/extract-user-from-request.decorator";
import { ExtractRefreshTokenPayload } from "../../guards/decorators/param/extract-refresh-token-payload.decorator";
import { RateLimitGuard } from "../../../rateLimit/guards/rate-limit.guard";

@Controller(SETTINGS.PATH.AUTH)
export class AuthController {
  constructor(
    private authQueryRepository: AuthQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Post("registration")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RateLimitGuard)
  async registerUser(@Req() req: Request, @Body() body: RegisterUserInputDto) {
    return this.commandBus.execute(
      new RegisterUserCommand({
        dto: body,
        currentURL: `${req.protocol + "://" + req.get("host")}`,
      }),
    );
  }

  @Post("registration-confirmation")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RateLimitGuard)
  async confirmRegistration(@Body() body: ConfirmUserRegistrationInputDto) {
    return this.commandBus.execute(
      new ConfirmUserRegistrationCommand(body.code),
    );
  }

  @Post("registration-email-resending")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RateLimitGuard)
  async resendRegistrationEmail(
    @Req() req: Request,
    @Body() body: ResendUserRegistrationEmailInputDto,
  ) {
    return this.commandBus.execute(
      new ResendUserRegistrationEmailCommand({
        email: body.email,
        currentURL: `${req.protocol + "://" + req.get("host")}`,
      }),
    );
  }

  @Post("password-recovery")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RateLimitGuard)
  async sendPasswordRecoveryCode(
    @Req() req: Request,
    @Body() body: SendPasswordRecoveryCodeInputDto,
  ) {
    return this.commandBus.execute(
      new SendUserPasswordRecoveryCodeCommand({
        email: body.email,
        currentURL: `${req.protocol + "://" + req.get("host")}`,
      }),
    );
  }

  @Post("new-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RateLimitGuard)
  async updatePassword(@Body() body: UpdatePasswordInputDto) {
    return this.commandBus.execute(new UpdateUserPasswordCommand(body));
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard, LocalAuthGuard)
  async loginUser(
    @ExtractUserFromRequest() user: UserContextDto,
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    accessToken: string;
  }> {
    const userAgent = req.headers["user-agent"];
    const ip = req.ip;

    const result = await this.commandBus.execute(
      new LoginUserCommand({ userId: user.id, userAgent, ip }),
    );

    response.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken: result.accessToken };
  }

  @ApiBearerAuth()
  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
    return this.authQueryRepository.me(user.id);
  }

  @Post("refresh-token")
  @HttpCode(HttpStatus.OK)
  @UseGuards(CookieJwtAuthGuard)
  async refreshToken(
    @ExtractRefreshTokenPayload() payload: RefreshTokenPayloadDto,
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    accessToken: string;
  }> {
    const userAgent = req.headers["user-agent"];
    const ip = req.ip;

    const result = await this.commandBus.execute(
      new RefreshTokenCommand({ payload, userAgent, ip }),
    );

    response.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken: result.accessToken };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CookieJwtAuthGuard)
  async logout(
    @ExtractRefreshTokenPayload() payload: RefreshTokenPayloadDto,
  ): Promise<void> {
    return this.commandBus.execute(new LogoutUserCommand(payload));
  }
}
