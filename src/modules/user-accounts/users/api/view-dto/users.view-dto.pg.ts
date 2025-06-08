import { UserDocument } from "../../domain/user.entity";
import { UserEntity } from "../../domain/user.entity.pg";

export class UserViewDtoPg {
  id: string;
  login: string;
  email: string;
  createdAt: string;
  // firstName: string;
  // lastName: string | null;

  static mapToView(user: UserEntity): UserViewDtoPg {
    const dto = new UserViewDtoPg();

    dto.id = user.id;
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;
    // dto.firstName = user.name.firstName;
    // dto.lastName = user.name.lastName;

    return dto;
  }
}

export class MeViewDto {
  email: string;
  login: string;
  userId: string;

  static mapToView(user: UserDocument): MeViewDto {
    const dto = new MeViewDto();

    dto.email = user.email;
    dto.login = user.login;
    dto.userId = user._id.toString();

    return dto;
  }
}
