import mongoose from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";

import { Post, PostDocument, PostModelType } from "../domain/post.entity";
import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";
import { BlogEntityType } from "../../blogs/domain/blog.entity.pg";
import { SETTINGS } from "../../../../settings";
import { PostEntityType } from "../domain/post.entity.pg";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { validate as isValidUUID } from "uuid";
import { PostLikeEntity } from "../domain/postLike.entity.pg";

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async createPost_pg(post: PostEntityType): Promise<void> {
    const query = `
        INSERT INTO ${SETTINGS.TABLES.POSTS}
            ("id","title","shortDescription","content","blogId","createdAt")
            VALUES
            ($1, $2, $3, $4, $5, $6)
    `;

    try {
      await this.dataSource.query(query, [
        post.id,
        post.title,
        post.shortDescription,
        post.content,
        post.blogId,
        post.createdAt,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to create post in db",
        extensions: [
          {
            field: "",
            message: "Failed to create post in db",
          },
        ],
      });
    }
  }

  async getByIdOrNotFoundFail_pg(postId: string): Promise<PostEntityType> {
    if (!isValidUUID(postId)) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Post not found",
        extensions: [
          {
            field: "",
            message: "Post not found",
          },
        ],
      });
    }

    let post: PostEntityType;

    const query = `
       SELECT p.*, b."name" as "blogName"
       FROM ${SETTINGS.TABLES.POSTS} p 
         LEFT JOIN ${SETTINGS.TABLES.BLOGS} b
         ON p."blogId" = b."id"
           WHERE p."id" = $1 AND p."deletedAt" IS NULL
    `;

    try {
      const result = await this.dataSource.query(query, [postId]);
      post = result?.[0];
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get post from db",
        extensions: [
          {
            field: "",
            message: "Failed to get post from db",
          },
        ],
      });
    }

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Post not found",
        extensions: [
          {
            field: "",
            message: "Post not found",
          },
        ],
      });
    }
    return post;
  }

  async updatePost_pg(post: PostEntityType): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.POSTS}
        SET "title" = $1,
            "shortDescription" = $2,
            "content" = $3,
            "blogId" = $4
        WHERE "id" = $5
    `;

    try {
      await this.dataSource.query(query, [
        post.title,
        post.shortDescription,
        post.content,
        post.blogId,
        post.id,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to update post",
        extensions: [
          {
            field: "",
            message: "Failed to update post",
          },
        ],
      });
    }
  }

  async deletePost_pg(dto: {
    postId: string;
    deletedAt: string;
  }): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.POSTS}
        SET "deletedAt" = $1
        WHERE "id" = $2
    `;

    try {
      await this.dataSource.query(query, [dto.deletedAt, dto.postId]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to delete post",
        extensions: [
          {
            field: "",
            message: "Failed to delete post",
          },
        ],
      });
    }
  }

  async findPostLike_pg(dto: {
    postId: string;
    userId: string;
  }): Promise<PostLikeEntity> {
    const query = `
       SELECT * FROM ${SETTINGS.TABLES.POSTS_LIKES}
       WHERE "postId" = $1 AND "userId" = $2
    `;

    try {
      const result = await this.dataSource.query(query, [
        dto.postId,
        dto.userId,
      ]);
      return result?.[0];
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get post like from db",
        extensions: [
          {
            field: "",
            message: "Failed to get post like from db",
          },
        ],
      });
    }
  }

  async createPostLike_pg(postLike: PostLikeEntity): Promise<void> {
    const query = `
        INSERT INTO ${SETTINGS.TABLES.POSTS_LIKES}
            ("postId","userId","likeStatus","updatedAt")
            VALUES
            ($1, $2, $3, $4)
    `;

    try {
      await this.dataSource.query(query, [
        postLike.postId,
        postLike.userId,
        postLike.likeStatus,
        postLike.updatedAt,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to create post like in db",
        extensions: [
          {
            field: "",
            message: "Failed to create post like in db",
          },
        ],
      });
    }
  }

  async deletePostLike_pg(postLikeId: number): Promise<void> {
    const query = `
        DELETE FROM ${SETTINGS.TABLES.POSTS_LIKES}
        WHERE "id" = $1
    `;

    try {
      await this.dataSource.query(query, [postLikeId]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to delete post like in db",
        extensions: [
          {
            field: "",
            message: "Failed to delete post like in db",
          },
        ],
      });
    }
  }

  async updatePostLike_pg(dto: {
    postLikeId: number;
    newLikeStatus: number;
    updatedAt: string;
  }): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.POSTS_LIKES}
        SET "likeStatus" = $1,
            "updatedAt" = $2
        WHERE "id" = $3
    `;

    try {
      await this.dataSource.query(query, [
        dto.newLikeStatus,
        dto.updatedAt,
        dto.postLikeId,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to update post like in db",
        extensions: [
          {
            field: "",
            message: "Failed to update post like in db",
          },
        ],
      });
    }
  }

  async save(post: PostDocument) {
    await post.save();
  }

  async findById(id: string): Promise<PostDocument | null> {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isObjectId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Post not found",
        extensions: [
          {
            field: "",
            message: "Post not found",
          },
        ],
      });
    }

    return this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    });
  }

  async findOrNotFoundFail(id: string): Promise<PostDocument> {
    const post = await this.findById(id);

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Post not found",
        extensions: [
          {
            field: "",
            message: "Post not found",
          },
        ],
      });
    }

    return post;
  }
}
