export class CreateSessionDomainDto {
  userId: string;
  deviceId: string;
  ip: string | undefined;
  userAgent: string | undefined;
  refreshToken: string;
}
