import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
import { IsNotEmpty } from "class-validator";

import { configValidationUtility } from "../../../setup/config-validation.utility";

@Injectable()
export class NotificationsConfig {
  @IsNotEmpty({
    message: "Set Env variable EMAIL_ACCOUNT, dangerous for security!",
  })
  emailAccount: string;

  @IsNotEmpty({
    message: "Set Env variable EMAIL_ACCOUNT_PASSWORD, dangerous for security!",
  })
  emailAccountPassword: string;

  constructor(private configService: ConfigService<any, true>) {
    this.emailAccount = this.configService.get("EMAIL_ACCOUNT");
    this.emailAccountPassword = this.configService.get(
      "EMAIL_ACCOUNT_PASSWORD",
    );

    configValidationUtility.validateConfig(this);
  }
}
