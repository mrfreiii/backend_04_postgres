import { NewestLikesPg } from "../../../types/likes.types";

export class UpdateLikesDto {
  likesCount: number;
  dislikesCount: number;
  newestLikes: NewestLikesPg[];
}
