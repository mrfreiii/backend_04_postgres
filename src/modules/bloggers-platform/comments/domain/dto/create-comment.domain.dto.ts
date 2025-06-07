export class CreateCommentDomainDto {
  postId: string;
  content: string;
  commentatorInfo: {
    userId: string,
    userLogin: string,
  };
}
