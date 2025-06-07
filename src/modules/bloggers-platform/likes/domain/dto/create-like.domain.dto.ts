import { LikeStatusEnum } from "../../enums/likes.enum";

export class CreateLikeDomainDto {
  status: LikeStatusEnum;
  entityId: string;
  userId: string;
  userLogin: string;
}
