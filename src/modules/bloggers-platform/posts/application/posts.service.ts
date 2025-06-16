import { Injectable } from "@nestjs/common";

import {
  LikeStatusEnum,
  mapEnumLikeStatusToBdStatus,
} from "../../enums/likes.enum";
import { CreatePostDto } from "../dto/post.dto";
import { PostEntity } from "../domain/post.entity.pg";
import { NewestLikesPg } from "../../types/likes.types";
import { GetPostByIdDto } from "./dto/get-post-by-id.dto";
import { PostViewDtoPg } from "../api/view-dto/posts.view-dto.pg";
import { PostsRepository } from "../infrastructure/posts.repository";
import { UpdatePostInputDto } from "../api/input-dto/update-post.input-dto";
import { BlogsRepository } from "../../blogs/infrastructure/blogs.repository";

@Injectable()
export class PostsService {
  constructor(
    private postsRepository: PostsRepository,
    private blogsRepository: BlogsRepository,
    private postEntity: PostEntity,
  ) {}

  async getPostById_pg(dto: GetPostByIdDto): Promise<PostViewDtoPg> {
    const { postId, userId } = dto;

    const post = await this.postsRepository.getByIdOrNotFoundFail_pg(postId);

    const likesCount = await this._getLikesCount_pg(postId);
    const dislikesCount = await this._getDislikesCount_pg(postId);
    const lastThreeLikes = await this._getLastThreeLikes_pg(postId);
    const userLikeStatus = await this._getUserLikeStatus_pg({ postId, userId });

    return PostViewDtoPg.mapToView({
      post,
      likesCount,
      dislikesCount,
      newestLikes: lastThreeLikes,
      myStatus: userLikeStatus,
    });
  }

  async getPostsLikeInfo_pg(dto: {
    posts: PostViewDtoPg[];
    userId: string | null;
  }): Promise<PostViewDtoPg[]> {
    const { posts, userId } = dto;

    const updatedPosts: PostViewDtoPg[] = [];

    for (let i = 0; i < posts.length; i++) {
      const likesCount = await this._getLikesCount_pg(posts[i].id);
      const dislikesCount = await this._getDislikesCount_pg(posts[i].id);
      const lastThreeLikes = await this._getLastThreeLikes_pg(posts[i].id);
      const userLikeStatus = await this._getUserLikeStatus_pg({
        postId: posts[i].id,
        userId,
      });

      updatedPosts.push({
        ...posts[i],
        extendedLikesInfo: {
          likesCount,
          dislikesCount,
          newestLikes: lastThreeLikes,
          myStatus: userLikeStatus,
        },
      });
    }

    return updatedPosts;
  }

  async createPost_pg(dto: CreatePostDto): Promise<string> {
    await this.blogsRepository.findByIdOrNotFoundFail_pg(dto.blogId);

    const post = this.postEntity.createInstance({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
    });

    await this.postsRepository.createPost_pg(post);

    return post.id;
  }

  async updatePost_pg({
    id,
    dto,
  }: {
    id: string;
    dto: UpdatePostInputDto;
  }): Promise<void> {
    await this.blogsRepository.findByIdOrNotFoundFail_pg(dto.blogId);

    const post = await this.postsRepository.getByIdOrNotFoundFail_pg(id);

    const updatedPost = this.postEntity.update({
      post,
      newValues: dto,
    });

    await this.postsRepository.updatePost_pg(updatedPost);
  }

  async deletePost_pg(dto: { postId: string; blogId: string }) {
    await this.blogsRepository.findByIdOrNotFoundFail_pg(dto.blogId);

    const post = await this.postsRepository.getByIdOrNotFoundFail_pg(
      dto.postId,
    );

    const deletedAt = new Date(Date.now()).toISOString();
    await this.postsRepository.deletePost_pg({ postId: post.id, deletedAt });
  }

  async updatePostLikeStatus_pg(dto: {
    userId: string;
    postId: string;
    newLikeStatus: LikeStatusEnum;
  }): Promise<void> {
    const { userId, postId, newLikeStatus } = dto;

    await this.postsRepository.getByIdOrNotFoundFail_pg(postId);

    const postLike = await this.postsRepository.findPostLike_pg({
      postId,
      userId,
    });

    if (!postLike?.id) {
      switch (newLikeStatus) {
        case LikeStatusEnum.None:
          break;
        case LikeStatusEnum.Like:
        case LikeStatusEnum.Dislike:
          await this.postsRepository.createPostLike_pg({
            postId,
            userId,
            likeStatus: mapEnumLikeStatusToBdStatus(newLikeStatus),
            updatedAt: new Date(Date.now()).toISOString(),
          });
          break;
      }
    } else {
      switch (newLikeStatus) {
        case LikeStatusEnum.None:
          await this.postsRepository.deletePostLike_pg(postLike.id);
          break;
        case LikeStatusEnum.Like:
        case LikeStatusEnum.Dislike:
          await this.postsRepository.updatePostLike_pg({
            postLikeId: postLike?.id,
            newLikeStatus: mapEnumLikeStatusToBdStatus(newLikeStatus),
            updatedAt: new Date(Date.now()).toISOString(),
          });
          break;
      }
    }
  }

  async _getLikesCount_pg(postId: string): Promise<number> {
    const response = await this.postsRepository.getPostLikesStatusCount_pg({
      postId,
      likeStatus: LikeStatusEnum.Like,
    });

    return response ?? 0;
  }

  async _getDislikesCount_pg(postId: string): Promise<number> {
    const response = await this.postsRepository.getPostLikesStatusCount_pg({
      postId,
      likeStatus: LikeStatusEnum.Dislike,
    });

    return response ?? 0;
  }

  async _getLastThreeLikes_pg(postId: string): Promise<NewestLikesPg[]> {
    const response =
      await this.postsRepository.getPostLastThreeLikes_pg(postId);

    return response ?? [];
  }

  async _getUserLikeStatus_pg(dto: {
    postId: string;
    userId: string | null;
  }): Promise<LikeStatusEnum> {
    const { userId, postId } = dto;

    let userLikeStatus = LikeStatusEnum.None;

    if (userId) {
      userLikeStatus = await this.postsRepository.getUserPostLikeStatus_pg({
        postId,
        userId,
      });
    }

    return userLikeStatus ?? LikeStatusEnum.None;
  }
}
