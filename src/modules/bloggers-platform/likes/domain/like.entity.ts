import { HydratedDocument, Model } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { LikeStatusEnum } from "../enums/likes.enum";
import { CreateLikeDomainDto } from "./dto/create-like.domain.dto";

//флаг timestamp автоматичеки добавляет поля updatedAt и createdAt
/**
 * Like Entity Schema
 * This class represents the schema and behavior of a Like entity.
 */
@Schema({ timestamps: true })
export class Like {
  /**
   * Status
   * @type {string}
   * @required
   */
  @Prop({ type: String, enum: LikeStatusEnum, required: true })
  status: string;

  /**
   * Entity id
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  entityId: string;

  /**
   * User id
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  userId: string;

  /**
   * User login
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  userLogin: string;

  /**
   * Creation timestamp
   * Explicitly defined despite timestamps: true
   * properties without @Prop for typescript so that they are in the class instance (or in instance methods)
   * @type {Date}
   */
  createdAt: Date;
  updatedAt: Date;

  /**
   * Factory method to create a Like instance
   * @param {CreateLikeDomainDto} dto - The data transfer object for post creation
   * @returns {LikeDocument} The created post document
   */
  static createInstance(dto: CreateLikeDomainDto): LikeDocument {
    const like = new this();

    like.status = dto.status;
    like.entityId = dto.entityId;
    like.userId = dto.userId;
    like.userLogin = dto.userLogin;

    return like as LikeDocument;
  }

  /**
   * Update like status
   */
  updateLikeStatus(newStatus: LikeStatusEnum) {
    this.status = newStatus;
  }
}

export const LikeSchema = SchemaFactory.createForClass(Like);

//регистрирует методы сущности в схеме
LikeSchema.loadClass(Like);

//Типизация документа
export type LikeDocument = HydratedDocument<Like>;

//Типизация модели + статические методы
export type LikeModelType = Model<LikeDocument> & typeof Like;
