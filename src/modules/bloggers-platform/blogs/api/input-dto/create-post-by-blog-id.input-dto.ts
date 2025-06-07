import { IsString, Length } from "class-validator";
import { Trim } from "../../../../../core/decorators/transform/trim";

export class CreatePostByBlogIdInputDto {
  @IsString()
  @Trim()
  @Length(1, 30)
  title: string;

  @IsString()
  @Trim()
  @Length(1, 100)
  shortDescription: string;

  @IsString()
  @Trim()
  @Length(1, 1000)
  content: string;
}