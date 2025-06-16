import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { validate as isValidUUID } from "uuid";
import { InjectDataSource } from "@nestjs/typeorm";

import { SETTINGS } from "../../../../settings";
import { BlogEntityType } from "../domain/blog.entity.pg";
import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";

@Injectable()
export class BlogsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createBlog_pg(blog: BlogEntityType): Promise<void> {
    const query = `
        INSERT INTO ${SETTINGS.TABLES.BLOGS}
            ("id","name","description","websiteUrl","isMembership","createdAt","deletedAt")
            VALUES
            ($1, $2, $3, $4, $5, $6, $7)
    `;

    try {
      await this.dataSource.query(query, [
        blog.id,
        blog.name,
        blog.description,
        blog.websiteUrl,
        blog.isMembership,
        blog.createdAt,
        blog.deletedAt,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to create blog in db",
        extensions: [
          {
            field: "",
            message: "Failed to create blog in db",
          },
        ],
      });
    }
  }

  async findByIdOrNotFoundFail_pg(blogId: string): Promise<BlogEntityType> {
    if (!isValidUUID(blogId)) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Blog not found",
        extensions: [
          {
            field: "",
            message: "Blog not found",
          },
        ],
      });
    }

    let blog: BlogEntityType;

    const query = `
       SELECT * FROM ${SETTINGS.TABLES.BLOGS} WHERE "id" = $1 AND "deletedAt" IS NULL
    `;

    try {
      const result = await this.dataSource.query(query, [blogId]);
      blog = result?.[0];
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get blog from db",
        extensions: [
          {
            field: "",
            message: "Failed to get blog from db",
          },
        ],
      });
    }

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Blog not found",
        extensions: [
          {
            field: "",
            message: "Blog not found",
          },
        ],
      });
    }
    return blog;
  }

  async updateBlog_pg(blog: BlogEntityType): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.BLOGS}
        SET "name" = $1,
            "description" = $2,
            "websiteUrl" = $3
        WHERE "id" = $4
    `;

    try {
      await this.dataSource.query(query, [
        blog.name,
        blog.description,
        blog.websiteUrl,
        blog.id,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to update blog",
        extensions: [
          {
            field: "",
            message: "Failed to update blog",
          },
        ],
      });
    }
  }

  async deleteBlog_pg(dto: {
    blogId: string;
    deletedAt: string;
  }): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.BLOGS}
        SET "deletedAt" = $1
        WHERE "id" = $2
    `;

    try {
      await this.dataSource.query(query, [dto.deletedAt, dto.blogId]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to delete blog",
        extensions: [
          {
            field: "",
            message: "Failed to delete blog",
          },
        ],
      });
    }
  }
}
