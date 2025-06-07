import { InjectModel } from "@nestjs/mongoose";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

import { CoreConfig } from "../../../core/config/core.config";
import { RateLimit, RateLimitModelType } from "../domain/rateLimit.entity";
import { DomainException } from "../../../core/exceptions/domain-exceptions";
import { RateLimitRepository } from "../infrastructure/rateLimit.repository";
import { DomainExceptionCode } from "../../../core/exceptions/domain-exception-codes";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private coreConfig: CoreConfig,
    private rateLimitRepository: RateLimitRepository,
    @InjectModel(RateLimit.name) private RateLimitModel: RateLimitModelType,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const url = req.originalUrl;
    const ip = req.ip || "unknown ip";
    const date = Date.now();

    const dateForSearch = date - this.coreConfig.rateLimitPeriodInSec * 1000;
    const sameRequestCount = await this.rateLimitRepository.getRequestCount({
      url,
      ip: ip!,
      date: dateForSearch,
    });

    if (sameRequestCount > this.coreConfig.rateLimitRequestsInPeriod - 1) {
      throw new DomainException({
        code: DomainExceptionCode.TooManyRequests,
        message: "Too many requests",
        extensions: [
          {
            field: "",
            message: "Too many requests",
          },
        ],
      });
    }

    const newRequest = this.RateLimitModel.createInstance({
      url,
      ip,
      date,
    });
    await this.rateLimitRepository.save(newRequest);

    return true;
  }
}
