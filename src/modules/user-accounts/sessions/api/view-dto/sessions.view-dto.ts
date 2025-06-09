import { SessionEntityType } from "../../domain/session.entity.pg";

export class SessionViewDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;

  static mapToView(session: SessionEntityType): SessionViewDto {
    const dto = new SessionViewDto();

    dto.ip = session.ip;
    dto.title = session.title;
    dto.lastActiveDate = session.issuedAt;
    dto.deviceId = session.deviceId;

    return dto;
  }
}
