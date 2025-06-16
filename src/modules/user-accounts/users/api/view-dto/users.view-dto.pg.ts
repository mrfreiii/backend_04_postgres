import { UserEntity } from "../../domain/user.entity.pg";

export class UserViewDtoPg {
  id: string;
  login: string;
  email: string;
  createdAt: string;

  static mapToView(user: UserEntity): UserViewDtoPg {
    const dto = new UserViewDtoPg();

    dto.id = user.id;
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;

    return dto;
  }
}

export class MeViewDtoPg {
  email: string;
  login: string;
  userId: string;

  static mapToView(user: UserEntity): MeViewDtoPg {
    const dto = new MeViewDtoPg();

    dto.email = user.email;
    dto.login = user.login;
    dto.userId = user.id;

    return dto;
  }
}
