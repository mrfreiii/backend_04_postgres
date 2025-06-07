import { IsString, Length, Matches } from "class-validator";
import { Trim } from "../../../../../core/decorators/transform/trim";

export class UpdateBlogInputDto {
  @IsString()
  @Trim()
  @Length(1, 15)
  name: string;

  @IsString()
  @Trim()
  @Length(1, 500)
  description: string;

  @IsString()
  @Trim()
  @Length(1, 100)
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  )
  websiteUrl: string;
}
