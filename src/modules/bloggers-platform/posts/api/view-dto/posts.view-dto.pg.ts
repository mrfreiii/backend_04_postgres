import { LikeStatusEnum } from "../../../enums/likes.enum";
import { PostEntityType } from "../../domain/post.entity.pg";
import { NewestLikesPg } from "../../../types/likes.types";

class PostViewDtoPgInputType {
  post: PostEntityType;
  likesCount?: number;
  dislikesCount?: number;
  myStatus?: LikeStatusEnum;
  newestLikes?: NewestLikesPg[];
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
    newestLikes: NewestLikesPg[] | [];
  };

  static mapToView(dto: PostViewDtoPgInputType): PostViewDtoPg {
    const post = new PostViewDtoPg();

    post.id = dto.post.id;
    post.title = dto.post.title;
    post.shortDescription = dto.post.shortDescription;
    post.content = dto.post.content;
    post.blogId = dto.post.blogId;
    post.blogName = dto.post.blogName;
    post.createdAt = dto.post.createdAt;
    post.extendedLikesInfo = {
      likesCount: dto.likesCount || 0,
      dislikesCount: dto.dislikesCount || 0,
      myStatus: dto.myStatus || LikeStatusEnum.None,
      newestLikes: dto.newestLikes || [],
    };

    return post;
  }
}
