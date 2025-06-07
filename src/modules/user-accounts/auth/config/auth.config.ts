import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
import { IsNotEmpty } from "class-validator";

import { configValidationUtility } from "../../../../setup/config-validation.utility";

@Injectable()
export class AuthConfig {
  @IsNotEmpty({
    message: "Set Env variable BASIC_AUTH_LOGIN, dangerous for security!",
  })
  basicAuthLogin: string;

  @IsNotEmpty({
    message: "Set Env variable BASIC_AUTH_PASSWORD, dangerous for security!",
  })
  basicAuthPassword: string;

  constructor(private configService: ConfigService<any, true>) {
    this.basicAuthLogin = this.configService.get("BASIC_AUTH_LOGIN");
    this.basicAuthPassword = this.configService.get("BASIC_AUTH_PASSWORD");

    configValidationUtility.validateConfig(this);
  }
}
