import { PostEntityType } from "../../domain/post.entity.pg";
import { LikeStatusEnum } from "../../../likes/enums/likes.enum";

class NewestLikesDto {
  addedAt: Date;
  userId: string;
  login: string;
}

export class PostViewDtoPg {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
    newestLikes: NewestLikesDto[] | [];
  };

  static mapToView(post: PostEntityType): PostViewDtoPg {
    const dto = new PostViewDtoPg();

    dto.id = post.id;
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;
    dto.createdAt = post.createdAt;
    dto.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatusEnum.None,
      newestLikes: [],
    };
    // dto.extendedLikesInfo = {
    //   likesCount: post.extendedLikesInfo.likesCount,
    //   dislikesCount: post.extendedLikesInfo.dislikesCount,
    //   myStatus: post.extendedLikesInfo.myStatus,
    //   newestLikes: post.extendedLikesInfo.newestLikes,
    // };

    return dto;
  }
}
