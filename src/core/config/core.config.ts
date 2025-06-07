import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from "class-validator";

import { configValidationUtility } from "../../setup/config-validation.utility";

export enum Environments {
  DEVELOPMENT = "development",
  STAGING = "staging",
  PRODUCTION = "production",
  TESTING = "testing",
}

@Injectable()
export class CoreConfig {
  @IsEnum(Environments, {
    message:
      "Set correct NODE_ENV value, available values: " +
      configValidationUtility.getEnumValues(Environments).join(", "),
  })
  env: string;

  @IsNumber(
    {},
    {
      message: "Set Env variable PORT, example: 3000",
    },
  )
  port: number;

  @IsNotEmpty({
    message:
      "Set Env variable MONGO_URL, example: mongodb+srv://login:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=Cluster",
  })
  mongoURL: string;

  @IsNotEmpty({
    message: "Set Env variable MONGO_DB_NAME, example: dev",
  })
  mongoDbName: string;

  @IsNotEmpty({
    message:
        "Set Env variable POSTGRES_URL, example: localhost",
  })
  postgresURL: string;

  @IsNumber(
      {},
      {
        message: "Set Env variable POSTGRES_PORT, example: 5432",
      },
  )
  postgresPort: number;

  @IsNotEmpty({
    message:
        "Set Env variable POSTGRES_USERNAME, example: username",
  })
  postgresUsername: string;

  @IsNotEmpty({
    message:
        "Set Env variable POSTGRES_PASSWORD, example: password",
  })
  postgresPassword: string;

  @IsNotEmpty({
    message:
        "Set Env variable POSTGRES_DB_NAME, example: dbname",
  })
  postgresDbName: string;

  @IsBoolean({
    message:
      "Set Env variable SEND_INTERNAL_SERVER_ERROR_DETAILS to enable/disable Dangerous for production internal server error details (message, etc), example: true, available values: true, false, 0, 1",
  })
  sendInternalServerErrorDetails: boolean;

  @IsBoolean({
    message:
        "Set Env variable RATE_LIMIT_ENABLED to enable/disable, dangerous for production! Example: true, available values: true, false, 0, 1",
  })
  rateLimitEnabled: boolean;

  @IsNumber(
    {},
    {
      message: "Set Env variable RATE_LIMIT_PERIOD_IN_SEC, example: 10",
    },
  )
  rateLimitPeriodInSec: number;

  @IsNumber(
    {},
    {
      message: "Set Env variable RATE_LIMIT_REQUESTS_IN_PERIOD, example: 10",
    },
  )
  rateLimitRequestsInPeriod: number;

  constructor(private configService: ConfigService<any, true>) {
    // env settings
    this.env = this.configService.get("NODE_ENV");
    this.port = configValidationUtility.convertToNumber(
      this.configService.get("PORT"),
    ) as number;

    // Mongo settings
    this.mongoURL = this.configService.get("MONGO_URL");
    this.mongoDbName = this.configService.get("MONGO_DB_NAME");

    // Postgres settings
    this.postgresURL = this.configService.get("POSTGRES_URL");
    this.postgresPort = configValidationUtility.convertToNumber(
        this.configService.get("POSTGRES_PORT"),
    ) as number;
    this.postgresUsername = this.configService.get("POSTGRES_USERNAME");
    this.postgresPassword = this.configService.get("POSTGRES_PASSWORD");
    this.postgresDbName = this.configService.get("POSTGRES_DB_NAME");

    // Rate limit settings
    this.rateLimitEnabled =
        configValidationUtility.convertToBoolean(
            this.configService.get("RATE_LIMIT_ENABLED"),
        ) as boolean;
    this.rateLimitPeriodInSec = configValidationUtility.convertToNumber(
      this.configService.get("RATE_LIMIT_PERIOD_IN_SEC"),
    ) as number;
    this.rateLimitRequestsInPeriod = configValidationUtility.convertToNumber(
      this.configService.get("RATE_LIMIT_REQUESTS_IN_PERIOD"),
    ) as number;

    // Other settings
    this.sendInternalServerErrorDetails =
        configValidationUtility.convertToBoolean(
            this.configService.get("SEND_INTERNAL_SERVER_ERROR_DETAILS"),
        ) as boolean;

    configValidationUtility.validateConfig(this);
  }
}
