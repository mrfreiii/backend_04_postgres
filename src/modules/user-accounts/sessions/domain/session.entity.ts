import { HydratedDocument, Model } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { getDeviceTitle } from "../helpers";
import { parseRefreshToken } from "../../auth/helpers";
import { CreateSessionDomainDto } from "./dto/create-session.domain.dto";
import { UpdateSessionDomainDto } from "./dto/update-session.domain.dto";

/**
 * Session Entity Schema
 * This class represents the schema and behavior of a Session entity.
 */
@Schema()
export class Session {
  /**
   * User id
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  userId: string;

  /**
   * Device id
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  deviceId: string;

  /**
   * Device ip
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  ip: string;

  /**
   * Device name
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  title: string;

  /**
   * Session version
   * @type {number}
   * @required
   */
  @Prop({ type: Number, required: true })
  version: number;

  /**
   * Session creation date
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  issuedAt: string;

  /**
   * Session expiration date
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  expirationTime: string;

  /**
   * Factory method to create a Session instance
   * @param {CreateSessionDomainDto} dto - The data transfer object for session creation
   * @returns {SessionDocument} The created session document
   */
  static createInstance(dto: CreateSessionDomainDto): SessionDocument {
    const session = new this();

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

    return session as SessionDocument;
  }

  /**
   * Updates the session instance with new data
   * @param {UpdateSessionDomainDto} dto - The data transfer object for session updates
   */
  update(dto: UpdateSessionDomainDto) {
    const deviceTitle = getDeviceTitle(dto.userAgent);
    const { issuedAt, expirationTime, version } = parseRefreshToken(
      dto.refreshToken,
    );

    this.ip = dto.ip || "unknown ip";
    this.title = deviceTitle;
    this.version = version;
    this.issuedAt = issuedAt;
    this.expirationTime = expirationTime;
  }
}

export const SessionSchema = SchemaFactory.createForClass(Session);

//регистрирует методы сущности в схеме
SessionSchema.loadClass(Session);

//Типизация документа
export type SessionDocument = HydratedDocument<Session>;

//Типизация модели + статические методы
export type SessionModelType = Model<SessionDocument> & typeof Session;
