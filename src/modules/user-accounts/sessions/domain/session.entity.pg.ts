import { Injectable } from "@nestjs/common";

import { getDeviceTitle } from "../helpers";
import { parseRefreshToken } from "../../auth/helpers";
import { CreateSessionDomainDto } from "./dto/create-session.domain.dto";

@Injectable()
export class SessionEntity {
  userId: string;
  deviceId: string;
  ip: string;
  title: string;
  version: number;
  issuedAt: string;
  expirationTime: string;

  constructor() {}

  createInstance(dto: CreateSessionDomainDto): SessionEntity {
    const session = new SessionEntity;

    const deviceTitle = getDeviceTitle(dto.userAgent);
    const { issuedAt, expirationTime, version } = parseRefreshToken(
      dto.refreshToken,
    );

    session.userId = dto.userId;
    session.deviceId = dto.deviceId;
    session.ip = dto.ip || "unknown ip";
    session.title = deviceTitle;
    session.version = version;
    session.issuedAt = issuedAt;
    session.expirationTime = expirationTime;

    return session;
  }
}