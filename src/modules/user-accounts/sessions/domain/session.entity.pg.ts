import { Injectable } from "@nestjs/common";

import { getDeviceTitle } from "../helpers";
import { parseRefreshToken } from "../../auth/helpers";
import { CreateSessionDomainDto } from "./dto/create-session.domain.dto";
import { UpdateSessionDomainDto } from "./dto/update-session.domain.dto";

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

  createInstance(dto: CreateSessionDomainDto): SessionEntityType {
    const session = new SessionEntity();

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

  update(dto: {
    session: SessionEntityType;
    newValues: UpdateSessionDomainDto;
  }): SessionEntityType {
    const updateSession = { ...dto.session };

    const deviceTitle = getDeviceTitle(dto.newValues.userAgent);
    const { issuedAt, expirationTime, version } = parseRefreshToken(
      dto.newValues.refreshToken,
    );

    updateSession.ip = dto.newValues.ip || "unknown ip";
    updateSession.title = deviceTitle;
    updateSession.version = version;
    updateSession.issuedAt = issuedAt;
    updateSession.expirationTime = expirationTime;

    return updateSession;
  }
}

export type SessionEntityType = Omit<
  SessionEntity,
  "createInstance" | "update"
>;
