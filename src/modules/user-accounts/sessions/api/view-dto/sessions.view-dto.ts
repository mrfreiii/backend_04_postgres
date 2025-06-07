import { SessionDocument } from "../../domain/session.entity";

export class SessionViewDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;

  static mapToView(session: SessionDocument): SessionViewDto {
    const dto = new SessionViewDto();

    dto.ip = session.ip;
    dto.title = session.title;
    dto.lastActiveDate = session.issuedAt;
    dto.deviceId = session.deviceId;

    return dto;
  }
}
