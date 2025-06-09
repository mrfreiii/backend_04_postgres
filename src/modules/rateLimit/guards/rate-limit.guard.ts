import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

import { CoreConfig } from "../../../core/config/core.config";
import { RateLimitEntity } from "../domain/rateLimit.entity.pg";
import { DomainException } from "../../../core/exceptions/domain-exceptions";
import { RateLimitRepository } from "../infrastructure/rateLimit.repository";
import { DomainExceptionCode } from "../../../core/exceptions/domain-exception-codes";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private coreConfig: CoreConfig,
    private rateLimitRepository: RateLimitRepository,
    private rateLimitEntity: RateLimitEntity,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if(!this.coreConfig.rateLimitEnabled){
      return true;
    }

    const req = context.switchToHttp().getRequest();

    const url = req.originalUrl;
    const ip = req.ip || "unknown ip";
    const date = Date.now();

    const dateForSearch = date - this.coreConfig.rateLimitPeriodInSec * 1000;
    const sameRequestCount = await this.rateLimitRepository.getRequestCount_pg({
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

    const newRequest = this.rateLimitEntity.createInstance({
      url,
      ip,
      date,
    });
    await this.rateLimitRepository.addRequest_pg(newRequest);

    return true;
  }
}
