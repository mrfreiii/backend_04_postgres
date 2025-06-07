import { IsEnum } from "class-validator";

import { CommentsSortBy } from "./comments-sort-by";
import { BaseQueryParams } from "../../../../../core/dto/base.query-params.input-dto";

export class GetCommentsQueryParams extends BaseQueryParams {
  @IsEnum(CommentsSortBy)
  sortBy = CommentsSortBy.CreatedAt;
}
