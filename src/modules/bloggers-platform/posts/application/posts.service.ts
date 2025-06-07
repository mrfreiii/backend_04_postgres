import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { CreatePostDto } from "../dto/post.dto";
import { GetPostByIdDto } from "./dto/get-post-by-id.dto";
import { NewestLikes } from "../domain/newestLikes.schema";
import { Post, PostModelType } from "../domain/post.entity";
import { PostViewDto } from "../api/view-dto/posts.view-dto";
import { LikeStatusEnum } from "../../likes/enums/likes.enum";
import { LikesService } from "../../likes/application/likes.service";
import { PostsRepository } from "../infrastructure/posts.repository";
import { UpdatePostInputDto } from "../api/input-dto/update-post.input-dto";
import { LikesRepository } from "../../likes/infrastructure/likes.repository";
import { BlogsExternalQueryRepository } from "../../blogs/infrastructure/external-query/blogs.external-query-repository";
import { GetLikesStatusesForPostsDto } from "./dto/get-all-post.dto";

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    private postsRepository: PostsRepository,
    private likesRepository: LikesRepository,
    private blogsExternalRepository: BlogsExternalQueryRepository,
    private likesService: LikesService,
  ) {}

  async getPostById(dto: GetPostByIdDto): Promise<PostViewDto> {
    const { postId, userId } = dto;

    const post = await this.postsRepository.findOrNotFoundFail(postId);

    if (userId) {
      const userLikeStatus =
        await this.likesRepository.getLikeByUserIdAndEntityId({
          userId,
          entityId: postId,
        });

      post.extendedLikesInfo.myStatus =
        userLikeStatus?.status ?? LikeStatusEnum.None;
    }

    return PostViewDto.mapToView(post);
  }

  async createPost(dto: CreatePostDto): Promise<string> {
    const blog = await this.blogsExternalRepository.getByIdOrNotFoundFail(
      dto.blogId,
    );

    const post = this.PostModel.createInstance({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: blog.name,
    });

    await this.postsRepository.save(post);

    return post._id.toString();
  }

  async updatePost({
    id,
    dto,
  }: {
    id: string;
    dto: UpdatePostInputDto;
  }): Promise<string> {
    const blog = await this.blogsExternalRepository.getByIdOrNotFoundFail(
      dto.blogId,
    );

    const post = await this.postsRepository.findOrNotFoundFail(id);

    post.update({
      ...dto,
      blogName: blog.name,
    });

    await this.postsRepository.save(post);

    return post._id.toString();
  }

  async deletePost(id: string) {
    const post = await this.postsRepository.findOrNotFoundFail(id);

    post.makeDeleted();

    await this.postsRepository.save(post);
  }

  async updatePostLikeStatus(dto: {
    userId: string;
    postId: string;
    newLikeStatus: LikeStatusEnum;
  }): Promise<void> {
    const { userId, postId, newLikeStatus } = dto;

    const post = await this.postsRepository.findOrNotFoundFail(postId);

    const newLikesAndDislikesCounts = await this.likesService.updateLike({
      userId,
      newLikeStatus,
      entityId: postId,
      currentLikesCount: post.extendedLikesInfo?.likesCount || 0,
      currentDislikesCount: post.extendedLikesInfo?.dislikesCount || 0,
    });

    let newestLikes: NewestLikes[] = post.extendedLikesInfo.newestLikes;
    let needToRecalculateNewestLikes = false;

    switch (newLikeStatus) {
      case LikeStatusEnum.Like:
        needToRecalculateNewestLikes = true;
        break;
      case LikeStatusEnum.Dislike:
      case LikeStatusEnum.None:
        if (newestLikes.some((newestLike) => newestLike.userId === userId)) {
          needToRecalculateNewestLikes = true;
        }
        break;
    }

    if (needToRecalculateNewestLikes) {
      newestLikes =
        await this.likesRepository.getLastThreeLikesForEntity(postId);
    }

    post.updateLikes({
      likesCount: newLikesAndDislikesCounts.newLikesCount,
      dislikesCount: newLikesAndDislikesCounts.newDislikesCount,
      newestLikes,
    });

    await this.postsRepository.save(post);
  }

  async getLikeStatusesForPosts(
    dto: GetLikesStatusesForPostsDto,
  ): Promise<PostViewDto[]> {
    const { posts, userId } = dto;

    const userLikeStatuses = await this.likesRepository.getLikesForEntities({
      userId: userId!,
      entitiesIds: posts.map((post) => post.id),
    });

    return posts.map((post) => {
      const userLikeStatus =
        userLikeStatuses.find(
          (status) => status.userId === userId && status.entityId === post.id,
        )?.status || LikeStatusEnum.None;

      return {
        ...post,
        extendedLikesInfo: {
          ...post.extendedLikesInfo,
          myStatus: userLikeStatus,
        },
      };
    });
  }
}
