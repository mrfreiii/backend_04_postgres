import { BlogDocument } from "../../../domain/blog.entity";

export class BlogExternalDto {
  id: string;
  name: string;

  static mapToView(blog: BlogDocument): BlogExternalDto {
    const dto = new BlogExternalDto();

    dto.id = blog._id.toString();
    dto.name = blog.name;

    return dto;
  }
}
