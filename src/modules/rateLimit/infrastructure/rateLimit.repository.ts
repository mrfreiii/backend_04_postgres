import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import {
  RateLimit,
  RateLimitDocument,
  RateLimitModelType,
} from "../domain/rateLimit.entity";
import { GetRequestCountInputDto } from "./dto/get-requests-count.input-dto";

@Injectable()
export class RateLimitRepository {
  constructor(
    @InjectModel(RateLimit.name) private RateLimitModel: RateLimitModelType,
  ) {}

  async save(request: RateLimitDocument) {
    await request.save();
  }

  async getRequestCount(dto: GetRequestCountInputDto): Promise<number> {
    const filter = {
      url: dto.url,
      ip: dto.ip,
      date: { $gte: dto.date },
    };

    return this.RateLimitModel.countDocuments(filter);
  }
}
