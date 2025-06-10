import { HydratedDocument, Model } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import {
  ExtendedLikesInfo,
  ExtendedLikesInfoSchema,
} from "./extendedLikesInfo.schema";
import { UpdatePostDto } from "../dto/post.dto";
import { LikeStatusEnum } from "../../likes/enums/likes.enum";
import { CreatePostDomainDto } from "./dto/create-post.domain.dto";
import { UpdateLikesDto } from "./dto/update-likes.dto";
import { v4 as uuidv4 } from "uuid";
import { UpdatePostInputDto } from "../api/input-dto/update-post.input-dto";

export class PostEntity {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string; // get from Blogs table
  createdAt: string;
  deletedAt: string | null;
  // extendedLikesInfo: ExtendedLikesInfo;

  createInstance(dto: CreatePostDomainDto): PostEntityType {
    const post = new PostEntity();

    post.id = uuidv4();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.createdAt = new Date(Date.now()).toISOString();
    // post.blogName = dto.blogName;
    // post.extendedLikesInfo = {
    //   likesCount: 0,
    //   dislikesCount: 0,
    //   myStatus: LikeStatusEnum.None,
    //   newestLikes: [],
    // };

    return post;
  }

  update(dto: {
    post: PostEntityType;
    newValues: UpdatePostInputDto;
  }): PostEntityType {
    const updatedPost = { ...dto.post };

    updatedPost.title = dto.newValues.title;
    updatedPost.shortDescription = dto.newValues.shortDescription;
    updatedPost.content = dto.newValues.content;
    updatedPost.blogId = dto.newValues.blogId;

    return updatedPost;
  }

  // updateLikes(dto: UpdateLikesDto) {
  //   this.extendedLikesInfo.likesCount = dto.likesCount;
  //   this.extendedLikesInfo.dislikesCount = dto.dislikesCount;
  //   this.extendedLikesInfo.newestLikes = dto.newestLikes;
  // }
}

export type PostEntityType = Omit<PostEntity, "createInstance" | "update">;
