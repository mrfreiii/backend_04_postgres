import { IsString } from "class-validator";

import { Trim } from "../../../../../core/decorators/transform/trim";

export class LoginUserInputDto {
  @IsString()
  @Trim()
  loginOrEmail: string;

  @IsString()
  @Trim()
  password: string;
}
