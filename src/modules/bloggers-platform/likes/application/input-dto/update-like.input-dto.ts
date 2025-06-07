import { LikeStatusEnum } from "../../enums/likes.enum";

export class UpdateLikeInputDto {
  userId: string;
  entityId: string;
  newLikeStatus: LikeStatusEnum;
  currentLikesCount: number;
  currentDislikesCount: number;
}
