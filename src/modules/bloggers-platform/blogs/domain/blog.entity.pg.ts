import { v4 as uuidv4 } from "uuid";
import { Injectable } from "@nestjs/common";

import { CreateBlogDomainDto } from "./dto/create-blog.domain.dto";
import { UpdateBlogInputDto } from "../api/input-dto/update-blog.input-dto";

@Injectable()
export class BlogEntity {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: string;
  deletedAt: string | null;

  constructor() {}

  createInstance(dto: CreateBlogDomainDto): BlogEntityType {
    const blog = new BlogEntity();

    blog.id = uuidv4();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    blog.isMembership = false; // пока всегда false
    blog.createdAt = new Date(Date.now()).toISOString();

    return blog;
  }

  update(dto: {
    blog: BlogEntityType;
    newValues: UpdateBlogInputDto;
  }): BlogEntityType {
    const updatedBlog = { ...dto.blog };

    updatedBlog.name = dto.newValues.name;
    updatedBlog.description = dto.newValues.description;
    updatedBlog.websiteUrl = dto.newValues.websiteUrl;

    return updatedBlog;
  }
}

export type BlogEntityType = Omit<BlogEntity, "createInstance" | "update">;
