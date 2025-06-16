import { v4 as uuidv4 } from "uuid";
import { CreateCommentDomainDto } from "./dto/create-comment.domain.dto";

export class CommentEntity {
  id: string;
  content: string;
  postId: string;
  userId: string;
  createdAt: string;
  deletedAt: string | null;

  // likesInfo: LikesInfo;

  createInstance(dto: CreateCommentDomainDto): CommentEntityType {
    const comment = new CommentEntity();

    comment.id = uuidv4();
    comment.content = dto.content;
    comment.postId = dto.postId;
    comment.userId = dto.userId!;
    comment.createdAt = new Date(Date.now()).toISOString();

    // comment.likesInfo = {
    //   likesCount: 0,
    //   dislikesCount: 0,
    //   myStatus: LikeStatusEnum.None,
    // };

    return comment;
  }

  // updateContent(content: string) {
  //   this.content = content;
  // }
  // makeDeleted() {
  //   if (this.deletedAt !== null) {
  //     throw new Error("Entity already deleted");
  //   }
  //   this.deletedAt = new Date();
  // }
  // updateLikes({
  //   likesCount,
  //   dislikesCount,
  // }: {
  //   likesCount: number;
  //   dislikesCount: number;
  // }) {
  //   this.likesInfo.likesCount = likesCount;
  //   this.likesInfo.dislikesCount = dislikesCount;
  // }
}

export type CommentEntityType = Omit<CommentEntity, "createInstance">;
