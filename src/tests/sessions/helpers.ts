import { jwtDecode } from "jwt-decode";
import { RefreshTokenPayloadDto } from "../../modules/user-accounts/auth/dto/tokensPayload.dto";

export const getDeviceIdFromRefreshTokenCookie = (cookie: string): string => {
  const refreshTokenCookie = (cookie as unknown as string[])?.find((v) =>
    v?.includes("refreshToken"),
  );
  const refreshToken = refreshTokenCookie?.split("=")[1] || "";

  const decodedToken: RefreshTokenPayloadDto = jwtDecode(refreshToken);
  return decodedToken?.deviceId;
};
