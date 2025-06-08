import { Connection } from "mongoose";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Controller, Delete, HttpCode, HttpStatus } from "@nestjs/common";

import {
  RateLimit,
  RateLimitModelType,
} from "../rateLimit/domain/rateLimit.entity";
import { SETTINGS } from "../../settings";
import { DomainException } from "../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../core/exceptions/domain-exception-codes";

@Controller(SETTINGS.PATH.TESTING)
export class TestingController {
  constructor(
    @InjectConnection() private readonly databaseConnection: Connection,
    @InjectModel(RateLimit.name) private RateLimitModel: RateLimitModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Delete("all-data")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    const promises = Object.keys(SETTINGS.TABLES).map((key) => {
      const query = `
       TRUNCATE TABLE ${SETTINGS.TABLES[key]} RESTART IDENTITY CASCADE;
    `;

      return this.dataSource.query(query);
    });

    try {
      await Promise.all(promises);

      return {
        status: "succeeded",
      };
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to truncate tables",
        extensions: [
          {
            field: "",
            message: "Failed to truncate tables",
          },
        ],
      });
    }
  }
  //
  // @Delete("rate-limits")
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async deleteRateLimit() {
  //   await this.RateLimitModel.deleteMany({});
  //
  //   return {
  //     status: "succeeded",
  //   };
  // }
}
