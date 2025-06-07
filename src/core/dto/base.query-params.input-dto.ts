import { Type } from "class-transformer";
import { IsEnum, IsNumber } from "class-validator";

export enum SortDirection {
  Asc = "asc",
  Desc = "desc",
  Ascending = "ascending",
  Descending = "descending",
  PositiveNumber = 1,
  NegativeNumber = -1,
}

export class BaseQueryParams {
  @Type(() => Number)
  @IsNumber()
  pageNumber: number = 1;

  @IsNumber()
  @Type(() => Number)
  pageSize: number = 10;

  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.Desc;

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
