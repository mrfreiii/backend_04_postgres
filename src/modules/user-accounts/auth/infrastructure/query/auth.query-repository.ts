import { Injectable } from "@nestjs/common";

import { MeViewDto } from "../../../users/api/view-dto/users.view-dto";
import { UsersRepository } from "../../../users/infrastructure/users.repository";

@Injectable()
export class AuthQueryRepository {
  constructor(private usersRepository: UsersRepository) {}

  async me(userId: string): Promise<MeViewDto> {
    const user = await this.usersRepository.findOrNotFoundFail(userId);

    return MeViewDto.mapToView(user);
  }
}
