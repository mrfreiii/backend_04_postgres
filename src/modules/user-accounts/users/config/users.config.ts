import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
import { IsNotEmpty } from "class-validator";

import { configValidationUtility } from "../../../../setup/config-validation.utility";

@Injectable()
export class UsersConfig {
  @IsNotEmpty({
    message: "Set Env variable ACCESS_TOKEN_SECRET, dangerous for security!",
  })
  accessTokenSecret: string;

  @IsNotEmpty({
    message: "Set Env variable REFRESH_TOKEN_SECRET, dangerous for security!",
  })
  refreshTokenSecret: string;

  @IsNotEmpty({
    message: "Set Env variable ACCESS_TOKEN_EXPIRES_IN",
  })
  accessTokenExpiresIn: string;

  @IsNotEmpty({
    message: "Set Env variable REFRESH_TOKEN_EXPIRES_IN",
  })
  refreshTokenExpiresIn: string;

  constructor(private configService: ConfigService<any, true>) {
    this.accessTokenSecret = this.configService.get("ACCESS_TOKEN_SECRET");
    this.refreshTokenSecret = this.configService.get("REFRESH_TOKEN_SECRET");
    this.accessTokenExpiresIn = this.configService.get(
      "ACCESS_TOKEN_EXPIRES_IN",
    );
    this.refreshTokenExpiresIn = this.configService.get(
      "REFRESH_TOKEN_EXPIRES_IN",
    );

    configValidationUtility.validateConfig(this);
  }
}
