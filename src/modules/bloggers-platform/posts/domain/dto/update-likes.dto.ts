import { NewestLikes } from "../newestLikes.schema";

export class UpdateLikesDto {
  likesCount: number;
  dislikesCount: number;
  newestLikes: NewestLikes[];
}
