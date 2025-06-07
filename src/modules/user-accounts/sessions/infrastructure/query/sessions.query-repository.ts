import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { SessionViewDto } from "../../api/view-dto/sessions.view-dto";
import { Session, SessionModelType } from "../../domain/session.entity";

@Injectable()
export class SessionsQueryRepository {
  constructor(
    @InjectModel(Session.name) private SessionModel: SessionModelType,
  ) {}

  async getAllActiveSessions(userId: string): Promise<SessionViewDto[]> {
    const sessions = await this.SessionModel.find({
      userId,
    });

    const onlyActiveSessions = sessions.filter(
      (session) => new Date(session.expirationTime) > new Date(),
    );

    return onlyActiveSessions.map(SessionViewDto.mapToView);
  }
}
