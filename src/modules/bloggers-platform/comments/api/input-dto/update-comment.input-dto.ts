import { IsString, Length } from "class-validator";

export class UpdateCommentInputDto {
  @IsString()
  @Length(20, 300)
  content: string;
}
