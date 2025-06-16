import { v4 as uuidv4 } from "uuid";
import { CreatePostDomainDto } from "./dto/create-post.domain.dto";
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

  createInstance(dto: CreatePostDomainDto): PostEntityType {
    const post = new PostEntity();

    post.id = uuidv4();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.createdAt = new Date(Date.now()).toISOString();

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
}

export type PostEntityType = Omit<PostEntity, "createInstance" | "update">;
