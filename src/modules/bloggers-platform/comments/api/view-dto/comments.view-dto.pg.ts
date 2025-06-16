import { CommentQuerySelectType } from "../../infrastructure/types/commentQueryType";
import { LikeStatusEnum } from "../../../likes/enums/likes.enum";

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

  static mapToView(comment: CommentQuerySelectType): CommentViewDtoPg {
    const dto = new CommentViewDtoPg();

    dto.id = comment.id;
    dto.content = comment.content;
    dto.commentatorInfo = {
      userId: comment.userId,
      userLogin: comment.userLogin,
    };
    dto.createdAt = comment.createdAt;
    dto.likesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatusEnum.None,
      // likesCount: comment.likesInfo.likesCount,
      // dislikesCount: comment.likesInfo.dislikesCount,
      // myStatus: comment.likesInfo.myStatus,
    };

    return dto;
  }
}
