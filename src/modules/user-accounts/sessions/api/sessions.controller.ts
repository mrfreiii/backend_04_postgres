import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ApiParam } from "@nestjs/swagger";

import { SETTINGS } from "../../../../settings";
import { RefreshTokenPayloadDto } from "../../auth/dto/tokensPayload.dto";
import { CookieJwtAuthGuard } from "../../guards/bearer/cookie-jwt-auth.guard";
import { SessionsQueryRepository } from "../infrastructure/query/sessions.query-repository";
import { DeleteSessionByIdCommand } from "../application/usecases/delete-session-by-id.usecase";
import { ExtractRefreshTokenPayload } from "../../guards/decorators/param/extract-refresh-token-payload.decorator";
import { DeleteAllOtherSessionCommand } from "../application/usecases/delete-all-other-sessions.usecase";

@Controller(SETTINGS.PATH.SESSIONS)
export class SessionsController {
  constructor(
    private sessionsQueryRepository: SessionsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get()
  @UseGuards(CookieJwtAuthGuard)
  async getActiveSessions(
    @ExtractRefreshTokenPayload() payload: RefreshTokenPayloadDto,
  ) {
    return this.sessionsQueryRepository.getAllActiveSessions(payload.userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CookieJwtAuthGuard)
  async deleteAllOtherSessions(
    @ExtractRefreshTokenPayload() payload: RefreshTokenPayloadDto,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteAllOtherSessionCommand(payload));
  }

  @ApiParam({ name: "deviceId" })
  @Delete(":deviceId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CookieJwtAuthGuard)
  async deleteSessionById(
    @Param("deviceId") deviceId: string,
    @ExtractRefreshTokenPayload() payload: RefreshTokenPayloadDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new DeleteSessionByIdCommand({
        deviceIdFromQueryParam: deviceId,
        payload,
      }),
    );
  }
}
