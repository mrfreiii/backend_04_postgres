import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { LikeStatusEnum } from "../../likes/enums/likes.enum";
import { NewestLikes, NewestLikesSchema } from "./newestLikes.schema";

@Schema({
  _id: false,
})
export class ExtendedLikesInfo {
  @Prop({ type: Number, required: true })
  likesCount: number;

  @Prop({ type: Number, required: true })
  dislikesCount: number;

  @Prop({ type: String, enum: LikeStatusEnum, required: true })
  myStatus: string;

  @Prop({ type: Array<typeof NewestLikesSchema> })
  newestLikes: NewestLikes[];
}

export const ExtendedLikesInfoSchema =
  SchemaFactory.createForClass(ExtendedLikesInfo);
