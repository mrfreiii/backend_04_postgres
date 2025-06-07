import { IsEnum } from "class-validator";
import { LikeStatusEnum } from "../../../likes/enums/likes.enum";

export class UpdateLikeStatusInputDto {
  @IsEnum(LikeStatusEnum)
  likeStatus: LikeStatusEnum;
}
