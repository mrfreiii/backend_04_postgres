import { CreateRateLimitDomainDto } from "./dto/create-rate-limit.domain.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RateLimitEntity {
  url: string;
  ip: string;
  date: number;

  createInstance(dto: CreateRateLimitDomainDto): RateLimitEntityType {
    const rateLimit = new RateLimitEntity();

    rateLimit.url = dto.url;
    rateLimit.ip = dto.ip;
    rateLimit.date = dto.date;

    return rateLimit;
  }
}

export type RateLimitEntityType = Omit<RateLimitEntity, "createInstance">

