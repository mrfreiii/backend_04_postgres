import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import {
  Session,
  SessionDocument,
  SessionModelType,
} from "../domain/session.entity";

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private SessionModel: SessionModelType,
  ) {}

  async save(session: SessionDocument) {
    await session.save();
  }

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
