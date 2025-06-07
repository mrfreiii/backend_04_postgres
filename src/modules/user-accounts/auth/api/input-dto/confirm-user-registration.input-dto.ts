import { IsString } from "class-validator";

export class ConfirmUserRegistrationInputDto {
  @IsString()
  code: string;
}
