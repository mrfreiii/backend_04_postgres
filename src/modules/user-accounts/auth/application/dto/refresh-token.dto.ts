import { RefreshTokenPayloadDto } from "../../dto/tokensPayload.dto";

export class RefreshTokenInputDto {
  payload: RefreshTokenPayloadDto;
  userAgent: string | undefined;
  ip: string | undefined;
}

export class RefreshTokenOutputDto {
  refreshToken: string;
  accessToken: string;
}
