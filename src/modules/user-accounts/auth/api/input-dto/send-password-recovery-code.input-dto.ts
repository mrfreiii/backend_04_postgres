import { IsEmail, IsString } from "class-validator";
import { Trim } from "../../../../../core/decorators/transform/trim";

export class SendPasswordRecoveryCodeInputDto {
  @IsString()
  @IsEmail()
  @Trim()
  email: string;
}
