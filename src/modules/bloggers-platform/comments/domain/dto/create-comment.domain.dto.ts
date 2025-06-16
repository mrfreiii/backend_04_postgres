export class CreateCommentDomainDto {
  content: string;
  postId: string;
  userId?: string;
  commentatorInfo?: {
    userId: string,
    userLogin: string,
  };
}
