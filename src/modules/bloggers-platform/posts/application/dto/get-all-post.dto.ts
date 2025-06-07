import { PostViewDto } from "../../api/view-dto/posts.view-dto";

export class GetLikesStatusesForPostsDto {
  posts: PostViewDto[];
  userId: string | null;
}
