import { IsString, Length } from "class-validator";

import { Trim } from "../../../../../core/decorators/transform/trim";
import { passwordConstraints } from "../../../users/domain/user.entity";

export class UpdatePasswordInputDto {
  @IsString()
  @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
  @Trim()
  newPassword: string;

  @IsString()
  recoveryCode: string;
}
