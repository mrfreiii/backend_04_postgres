export class AccessTokenPayloadDto {
  id: string;
}

export class RefreshTokenPayloadDto {
  userId: string;
  deviceId: string;
  version: number;
  iat?: number;
  exp?: number;
}
