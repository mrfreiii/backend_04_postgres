import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RefreshTokenPayloadDto } from "../../../auth/dto/tokensPayload.dto";

export const ExtractRefreshTokenPayload = createParamDecorator(
  (data: unknown, context: ExecutionContext): RefreshTokenPayloadDto => {
    const request = context.switchToHttp().getRequest();

    return request.payload;
  },
);
