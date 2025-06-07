import { HydratedDocument, Model } from "mongoose";
import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";

import { CreateRateLimitDomainDto } from "./dto/create-rate-limit.domain.dto";

/**
 * Rate limit Entity Schema
 * This class represents the schema and behavior of a Blog entity.
 */
@Schema()
export class RateLimit {
  /**
   * URL of the request
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  url: string;

  /**
   * IP of the request
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  ip: string;

  /**
   * Date of the request
   * @type {number}
   * @required
   */
  @Prop({ type: Number, required: true })
  date: number;

  /**
   * Factory method to create a RateLimit instance
   * @param {CreateRateLimitDomainDto} dto - The data transfer object for rateLimit creation
   * @returns {BlogDocument} The created blog document
   */
  static createInstance(dto: CreateRateLimitDomainDto): RateLimitDocument {
    const rateLimit = new this();

    rateLimit.url = dto.url;
    rateLimit.ip = dto.ip;
    rateLimit.date = dto.date;

    return rateLimit as RateLimitDocument;
  }
}

export const RateLimitSchema = SchemaFactory.createForClass(RateLimit);

//регистрирует методы сущности в схеме
RateLimitSchema.loadClass(RateLimit);

//Типизация документа
export type RateLimitDocument = HydratedDocument<RateLimit>;

//Типизация модели + статические методы
export type RateLimitModelType = Model<RateLimitDocument> & typeof RateLimit;
