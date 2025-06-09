import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { validate as isValidUUID } from "uuid";
import { InjectDataSource } from "@nestjs/typeorm";

import { SETTINGS } from "../../../../settings";
import { SessionEntityType } from "../domain/session.entity.pg";
import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";

@Injectable()
export class SessionsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createSession_pg(session: SessionEntityType) {
    const query = `
        INSERT INTO ${SETTINGS.TABLES.SESSIONS}
            ("userId","deviceId","ip","title","version","issuedAt","expirationTime")
            VALUES
            ($1, $2, $3, $4, $5, $6, $7)
    `;

    try {
      await this.dataSource.query(query, [
        session.userId,
        session.deviceId,
        session.ip,
        session.title,
        session.version,
        session.issuedAt,
        session.expirationTime,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to create a session",
        extensions: [
          {
            field: "",
            message: "Failed to create a session",
          },
        ],
      });
    }
  }

  async findBy_userId_deviceId_version_pg(dto: {
    userId: string;
    deviceId: string;
    version: number;
  }): Promise<SessionEntityType> {
    const { userId, deviceId, version } = dto;

    const query = `
        SELECT * FROM ${SETTINGS.TABLES.SESSIONS}
            WHERE "userId" = $1
            AND "deviceId" = $2
            AND "version" = $3
    `;

    try {
      const result = await this.dataSource.query(query, [
        userId,
        deviceId,
        version,
      ]);
      return result?.[0];
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

  async updateSession_pg(session: SessionEntityType): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.SESSIONS}
        SET "ip" = $1,
            "title" = $2,
            "version" = $3,
            "issuedAt" = $4,
            "expirationTime" = $5
        WHERE "deviceId" = $6
    `;

    try {
      await this.dataSource.query(query, [
        session.ip,
        session.title,
        session.version,
        session.issuedAt,
        session.expirationTime,
        session.deviceId,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to update session",
        extensions: [
          {
            field: "",
            message: "Failed to update session",
          },
        ],
      });
    }
  }

  async deleteSession_pg(deviceId: string): Promise<void> {
    const query = `
        DELETE FROM ${SETTINGS.TABLES.SESSIONS}
        WHERE "deviceId" = $1
    `;

    try {
      await this.dataSource.query(query, [deviceId]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to delete session",
        extensions: [
          {
            field: "",
            message: "Failed to delete session",
          },
        ],
      });
    }
  }

  async findByDeviceId_pg(deviceId: string): Promise<SessionEntityType> {
    if (!isValidUUID(deviceId)) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Session not found",
        extensions: [
          {
            field: "",
            message: "Session not found",
          },
        ],
      });
    }

    const query = `
        SELECT * FROM ${SETTINGS.TABLES.SESSIONS}
            WHERE "deviceId" = $1
    `;

    try {
      const result = await this.dataSource.query(query, [deviceId]);
      return result?.[0];
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

  async deleteAllOtherSessions_pg(dto: {
    currentDeviceId: string;
    userId: string;
  }): Promise<void> {
    const query = `
        DELETE FROM ${SETTINGS.TABLES.SESSIONS}
        WHERE "userId" = $1 
        AND "deviceId" != $2
    `;

    try {
      await this.dataSource.query(query, [dto.userId, dto.currentDeviceId]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to delete sessions",
        extensions: [
          {
            field: "",
            message: "Failed to delete sessions",
          },
        ],
      });
    }
  }
}
