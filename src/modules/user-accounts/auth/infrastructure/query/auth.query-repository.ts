import { Injectable } from "@nestjs/common";

import { MeViewDtoPg } from "../../../users/api/view-dto/users.view-dto.pg";
import { UsersRepository } from "../../../users/infrastructure/users.repository";

@Injectable()
export class AuthQueryRepository {
  constructor(private usersRepository: UsersRepository) {}

  async me_pg(userId: string): Promise<MeViewDtoPg> {
    const user = await this.usersRepository.findOrNotFoundFail_pg(userId);

    return MeViewDtoPg.mapToView(user);
  }
}
