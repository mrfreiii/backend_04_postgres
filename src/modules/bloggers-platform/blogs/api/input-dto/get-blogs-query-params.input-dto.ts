import { IsOptional, IsString } from "class-validator";

import { BlogsSortBy } from "./blogs-sort-by";
import { BaseQueryParams } from "../../../../../core/dto/base.query-params.input-dto";

export class GetBlogsQueryParams extends BaseQueryParams {
  @IsOptional()
  // @IsEnum(BlogsSortBy)
  sortBy = BlogsSortBy.CreatedAt;

  @IsOptional()
  @IsString()
  searchNameTerm: string | null = null;
}
