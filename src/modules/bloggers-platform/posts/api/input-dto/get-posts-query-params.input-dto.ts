import { IsOptional, IsString } from "class-validator";

import { PostsSortBy } from "./posts-sort-by";
import { BaseQueryParams } from "../../../../../core/dto/base.query-params.input-dto";

export class GetPostsQueryParams extends BaseQueryParams {
  @IsOptional()
  // @IsEnum(PostsSortBy)
  sortBy = PostsSortBy.CreatedAt;
}
