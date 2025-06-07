import { LikeStatusEnum } from "../../enums/likes.enum";
import { LikeDocument } from "../../domain/like.entity";

export class LikeViewDto {
  status: LikeStatusEnum;
  entityId: string;
  userId: string;
  userLogin: string;

  static mapToView(like: LikeDocument): LikeViewDto {
    const dto = new LikeViewDto();

    dto.status = like.status as LikeStatusEnum;
    dto.entityId = like.entityId;
    dto.userId = like.userId;
    dto.userLogin = like.userLogin;

    return dto;
  }
}
