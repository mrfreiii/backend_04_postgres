import { Connection } from "mongoose";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Controller, Delete, HttpCode, HttpStatus } from "@nestjs/common";

import { SETTINGS } from "../../settings";
import {
  RateLimit,
  RateLimitModelType,
} from "../rateLimit/domain/rateLimit.entity";

@Controller(SETTINGS.PATH.TESTING)
export class TestingController {
  constructor(
    @InjectConnection() private readonly databaseConnection: Connection,
    @InjectModel(RateLimit.name) private RateLimitModel: RateLimitModelType,
  ) {}

  @Delete("all-data")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    const collections = await this.databaseConnection.listCollections();

    const promises = collections.map((collection) =>
      this.databaseConnection.collection(collection.name).deleteMany({}),
    );
    await Promise.all(promises);

    return {
      status: "succeeded",
    };
  }

  @Delete("rate-limits")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRateLimit() {
    await this.RateLimitModel.deleteMany({});

    return {
      status: "succeeded",
    };
  }
}
