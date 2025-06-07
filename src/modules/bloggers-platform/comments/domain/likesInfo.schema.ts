import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { LikeStatusEnum } from "../../likes/enums/likes.enum";

@Schema({
  _id: false,
})
export class LikesInfo {
  @Prop({ type: Number, required: true })
  likesCount: number;

  @Prop({ type: Number, required: true })
  dislikesCount: number;

  @Prop({ type: String, enum: LikeStatusEnum, required: true })
  myStatus: string;
}

export const LikesInfoSchema = SchemaFactory.createForClass(LikesInfo);
