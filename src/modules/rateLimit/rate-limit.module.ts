import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { RateLimit, RateLimitSchema } from "./domain/rateLimit.entity";
import { RateLimitRepository } from "./infrastructure/rateLimit.repository";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RateLimit.name, schema: RateLimitSchema },
    ]),
  ],
  controllers: [],
  providers: [RateLimitRepository],
  exports: [
    RateLimitRepository,
    MongooseModule.forFeature([
      { name: RateLimit.name, schema: RateLimitSchema },
    ]),
  ],
})
export class RateLimitModule {}
