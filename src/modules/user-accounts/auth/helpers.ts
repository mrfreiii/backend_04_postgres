import { jwtDecode } from "jwt-decode";
import { RefreshTokenPayloadDto } from "./dto/tokensPayload.dto";

export const parseRefreshToken = (
  token: string,
): {
  issuedAt: string;
  expirationTime: string;
  version: number;
} => {
  const decodedToken: RefreshTokenPayloadDto = jwtDecode(token);

  return {
    issuedAt: decodedToken?.iat
      ? new Date(decodedToken?.iat * 1000).toISOString()
      : "",
    expirationTime: decodedToken?.exp
      ? new Date(decodedToken?.exp * 1000).toISOString()
      : "",
    version: decodedToken.version,
  };
};
