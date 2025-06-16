import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";

import { SETTINGS } from "../../../../../settings";
import { SessionEntityType } from "../../domain/session.entity.pg";
import { SessionViewDto } from "../../api/view-dto/sessions.view-dto";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";

@Injectable()
export class SessionsQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getAllActiveSessions_pg(userId: string): Promise<SessionViewDto[]> {
    const query = `
        SELECT * FROM ${SETTINGS.TABLES.SESSIONS}
            WHERE "userId" = $1
            ORDER BY "issuedAt" asc
    `;

    try {
      const sessions: SessionEntityType[] = await this.dataSource.query(query, [
        userId,
      ]);

      const onlyActiveSessions = sessions.filter(
        (session) => new Date(session.expirationTime) > new Date(),
      );

      return onlyActiveSessions.map(SessionViewDto.mapToView);
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get session from db",
        extensions: [
          {
            field: "",
            message: "Failed to get session from db",
          },
        ],
      });
    }
  }
}
