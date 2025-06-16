import { LikeStatusEnum } from "../../../enums/likes.enum";
import { CommentQuerySelectType } from "../../infrastructure/types/commentQueryType";

export class CommentViewDtoPgInputType {
  comment: CommentQuerySelectType;
  likesCount?: number;
  dislikesCount?: number;
  myStatus?: LikeStatusEnum;
}

export class CommentViewDtoPg {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
  };

  static mapToView(dto: CommentViewDtoPgInputType): CommentViewDtoPg {
    const comment = new CommentViewDtoPg();

    comment.id = dto.comment.id;
    comment.content = dto.comment.content;
    comment.commentatorInfo = {
      userId: dto.comment.userId,
      userLogin: dto.comment.userLogin,
    };
    comment.createdAt = dto.comment.createdAt;
    comment.likesInfo = {
      likesCount: dto.likesCount || 0,
      dislikesCount: dto.dislikesCount || 0,
      myStatus: dto.myStatus || LikeStatusEnum.None,
    };

    return comment;
  }
}
