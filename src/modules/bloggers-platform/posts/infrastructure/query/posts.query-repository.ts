import mongoose, { FilterQuery } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";

import { Post, PostModelType } from "../../domain/post.entity";
import { PostViewDto } from "../../api/view-dto/posts.view-dto";
import { PaginatedViewDto } from "../../../../../core/dto/base.paginated.view-dto";
import { GetPostsQueryParams } from "../../api/input-dto/get-posts-query-params.input-dto";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";
import { BlogViewDtoPg } from "../../../blogs/api/view-dto/blogs.view-dto.pg";
import { validate as isValidUUID } from "uuid";
import { BlogEntityType } from "../../../blogs/domain/blog.entity.pg";
import { SETTINGS } from "../../../../../settings";
import { PostViewDtoPg } from "../../api/view-dto/posts.view-dto.pg";
import { PostEntityType } from "../../domain/post.entity.pg";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { GetBlogsQueryParams } from "../../../blogs/api/input-dto/get-blogs-query-params.input-dto";

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getByIdOrNotFoundFail_pg(postId: string): Promise<PostViewDtoPg> {
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
    return PostViewDtoPg.mapToView({ post });
  }

  async getAll_pg({
    requestParams,
    blogId,
  }: {
    requestParams: GetPostsQueryParams;
    blogId?: string;
  }): Promise<PaginatedViewDto<PostViewDtoPg[]>> {
    const queryParams: string[] = [];

    let dataQuery = `
       SELECT p.*, b."name" as "blogName" 
       FROM ${SETTINGS.TABLES.POSTS} p
         LEFT JOIN ${SETTINGS.TABLES.BLOGS} b
         ON p."blogId" = b."id"
           WHERE p."deletedAt" IS NULL
    `;
    let countQuery = `
       SELECT count(*)
       FROM ${SETTINGS.TABLES.POSTS} p
         LEFT JOIN ${SETTINGS.TABLES.BLOGS} b
         ON p."blogId" = b."id"
           WHERE p."deletedAt" IS NULL
    `;

    if (blogId) {
      const additionalPart = ` AND p."blogId" = $1`;

      dataQuery = `${dataQuery} ${additionalPart}`;
      countQuery = `${countQuery} ${additionalPart}`;

      queryParams.push(blogId);
    }

    dataQuery = `
       ${dataQuery}
         ORDER BY "${requestParams.sortBy}" ${requestParams.sortDirection}
         LIMIT ${requestParams.pageSize}
         OFFSET ${requestParams.calculateSkip()}
    `;

    try {
      const posts = await this.dataSource.query(dataQuery, [...queryParams]);

      const totalCountRes = await this.dataSource.query(countQuery, [
        ...queryParams,
      ]);

      const items = posts.map((p) => PostViewDtoPg.mapToView({ post: p }));

      return PaginatedViewDto.mapToView({
        items,
        totalCount: Number(totalCountRes?.[0]?.count),
        page: requestParams.pageNumber,
        size: requestParams.pageSize,
      });
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get posts from db",
        extensions: [
          {
            field: "",
            message: "Failed to get posts from db",
          },
        ],
      });
    }
  }

  async getAll({
    query,
    blogId,
  }: {
    query: GetPostsQueryParams;
    blogId?: string;
  }): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter: FilterQuery<Post> = {
      deletedAt: null,
    };

    if (blogId) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        blogId: { $regex: blogId, $options: "i" },
      });
    }

    const posts = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.PostModel.countDocuments(filter);

    const items = posts.map(PostViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getByIdOrNotFoundFail(id: string): Promise<PostViewDto> {
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

    const post = await this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    });

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

    return PostViewDto.mapToView(post);
  }
}
