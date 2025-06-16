import { Module } from "@nestjs/common";

import { RateLimitEntity } from "./domain/rateLimit.entity.pg";
import { RateLimitRepository } from "./infrastructure/rateLimit.repository";

@Module({
  imports: [],
  controllers: [],
  providers: [RateLimitRepository, RateLimitEntity],
  exports: [RateLimitEntity, RateLimitRepository],
})
export class RateLimitModule {}
