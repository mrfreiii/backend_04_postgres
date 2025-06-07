export class LoginUserInputDto {
  userId: string;
  userAgent: string | undefined;
  ip: string | undefined;
}

export class LoginUserOutputDto {
  accessToken: string;
  refreshToken: string;
}
