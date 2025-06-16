import { PostViewDtoPg } from "../../api/view-dto/posts.view-dto.pg";

export class GetLikesStatusesForPostsDto {
  posts: PostViewDtoPg[];
  userId: string | null;
}
