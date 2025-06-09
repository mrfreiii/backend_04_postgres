import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { RateLimitEntity } from "./domain/rateLimit.entity.pg";
import { RateLimit, RateLimitSchema } from "./domain/rateLimit.entity";
import { RateLimitRepository } from "./infrastructure/rateLimit.repository";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RateLimit.name, schema: RateLimitSchema },
    ]),
  ],
  controllers: [],
  providers: [RateLimitRepository, RateLimitEntity],
  exports: [
    RateLimitEntity,
    RateLimitRepository,
    MongooseModule.forFeature([
      { name: RateLimit.name, schema: RateLimitSchema },
    ]),
  ],
})
export class RateLimitModule {}
