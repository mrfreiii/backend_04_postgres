//dto для боди при создании юзера. Сюда могут быть добавлены декораторы swagger
import { IsEmail, IsString, Length, Matches } from "class-validator";
import { Trim } from "../../../../../core/decorators/transform/trim";
import {
  loginConstraints,
  passwordConstraints,
} from "../../domain/user.entity";
import { IsStringWithTrim } from "../../../../../core/decorators/validation/is-string-with-trim";

export class CreateUserInputDto {
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
