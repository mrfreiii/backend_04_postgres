import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectDataSource } from "@nestjs/typeorm";

import {
  Session,
  SessionDocument,
  SessionModelType,
} from "../domain/session.entity";
import { SETTINGS } from "../../../../settings";
import { SessionEntityType } from "../domain/session.entity.pg";
import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private SessionModel: SessionModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

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
    } catch (e){
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

  // async save(session: SessionDocument) {
  //   await session.save();
  // }

  async findByDeviceId(deviceId: string): Promise<SessionDocument | null> {
    return this.SessionModel.findOne({
      deviceId,
    });
  }

  async findBy_userId_deviceId_version(dto: {
    userId: string;
    deviceId: string;
    version: number;
  }): Promise<SessionDocument | null> {
    const { userId, deviceId, version } = dto;

    return this.SessionModel.findOne({
      userId,
      deviceId,
      version,
    });
  }

  async deleteSession(dto: {
    deviceId: string;
    userId: string;
  }): Promise<boolean> {
    const { deviceId, userId } = dto;

    try {
      const result = await this.SessionModel.deleteOne({
        deviceId,
        userId,
      });
      return result.deletedCount === 1;
    } catch {
      return false;
    }
  }

  async deleteAllOtherSession(dto: {
    currentDeviceId: string;
    userId: string;
  }): Promise<boolean> {
    const { currentDeviceId, userId } = dto;

    try {
      const result = await this.SessionModel.deleteMany({
        deviceId: { $ne: currentDeviceId },
        userId,
      });
      return result.deletedCount === 1;
    } catch {
      return false;
    }
  }
}
