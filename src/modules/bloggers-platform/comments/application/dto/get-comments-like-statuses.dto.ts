import { CommentViewDto } from "../../api/view-dto/comments.view-dto";

export class GetCommentsLikesStatusesDto {
  comments: CommentViewDto[];
  userId: string | null;
}
