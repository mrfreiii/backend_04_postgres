import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";

import { SETTINGS } from "../../../settings";
import { RateLimitEntityType } from "../domain/rateLimit.entity.pg";
import { GetRequestCountInputDto } from "./dto/get-requests-count.input-dto";
import { DomainException } from "../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../core/exceptions/domain-exception-codes";

@Injectable()
export class RateLimitRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getRequestCount_pg(dto: GetRequestCountInputDto): Promise<number> {
    const query = `
        SELECT count(*) FROM ${SETTINGS.TABLES.RATE_LIMIT}
            WHERE "url" = $1
            AND "ip" = $2
            AND "date" > $3
    `;

    try {
      const response = await this.dataSource.query(query, [
        dto.url,
        dto.ip,
        dto.date,
      ]);
      return Number(response?.[0]?.count);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to count requests",
        extensions: [
          {
            field: "",
            message: "Failed to count requests",
          },
        ],
      });
    }
  }

  async addRequest_pg(request: RateLimitEntityType) {
    const query = `
        INSERT INTO ${SETTINGS.TABLES.RATE_LIMIT}
            ("url","ip","date")
            VALUES
            ($1, $2, $3)
    `;

    try {
      await this.dataSource.query(query, [
        request.url,
        request.ip,
        request.date,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to save request",
        extensions: [
          {
            field: "",
            message: "Failed to save request",
          },
        ],
      });
    }
  }
}
