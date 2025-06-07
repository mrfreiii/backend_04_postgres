import { IsEnum, IsOptional, IsString } from "class-validator";

import { UsersSort } from "./users-sort";
import { BaseQueryParams } from "../../../../../core/dto/base.query-params.input-dto";

export class GetUsersQueryParams extends BaseQueryParams {
  @IsEnum(UsersSort)
  sortBy = UsersSort.CreatedAt;

  @IsString()
  @IsOptional()
  searchLoginTerm: string | null = null;

  @IsString()
  @IsOptional()
  searchEmailTerm: string | null = null;
}
