import { RefreshTokenPayloadDto } from "../../../auth/dto/tokensPayload.dto";

export class DeleteSessionByIdInputDto {
  deviceIdFromQueryParam: string;
  payload: RefreshTokenPayloadDto;
}
