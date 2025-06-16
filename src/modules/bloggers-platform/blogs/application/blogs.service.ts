import { Injectable } from "@nestjs/common";

import { CreateBlogDto } from "../dto/blog.dto";
import { BlogEntity } from "../domain/blog.entity.pg";
import { BlogsRepository } from "../infrastructure/blogs.repository";
import { UpdateBlogInputDto } from "../api/input-dto/update-blog.input-dto";

@Injectable()
export class BlogsService {
  constructor(
    private blogsRepository: BlogsRepository,
    private blogEntity: BlogEntity,
  ) {}

  async createBlog(dto: CreateBlogDto): Promise<string> {
    const blog = this.blogEntity.createInstance({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });

    await this.blogsRepository.createBlog_pg(blog);

    return blog.id;
  }

  async updateBlog({
    id,
    dto,
  }: {
    id: string;
    dto: UpdateBlogInputDto;
  }): Promise<void> {
    const blog = await this.blogsRepository.findByIdOrNotFoundFail_pg(id);

    const updatedBlog = this.blogEntity.update({ blog, newValues: dto });
    await this.blogsRepository.updateBlog_pg(updatedBlog);
  }

  async deleteBlog(id: string) {
    const blog = await this.blogsRepository.findByIdOrNotFoundFail_pg(id);

    const deletedAt = new Date(Date.now()).toISOString();
    await this.blogsRepository.deleteBlog_pg({ blogId: blog.id, deletedAt });
  }
}
