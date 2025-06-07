import { IsEmail, IsString, Length, Matches } from "class-validator";

import {
  loginConstraints,
  passwordConstraints,
} from "../../../users/domain/user.entity";
import { Trim } from "../../../../../core/decorators/transform/trim";
import { IsStringWithTrim } from "../../../../../core/decorators/validation/is-string-with-trim";

export class RegisterUserInputDto {
  @IsStringWithTrim(loginConstraints.minLength, loginConstraints.maxLength)
  @Matches(/^[a-zA-Z0-9_-]*$/)
  login: string;

  @IsString()
  @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
  @Trim()
  password: string;

  @IsString()
  @IsEmail()
  @Trim()
  email: string;
}
