import { SETTINGS } from "../../settings";
import { req, testBasicAuthHeader } from "../helpers";
import { UserViewDto } from "../../modules/user-accounts/users/api/view-dto/users.view-dto";
import { CreateUserInputDto } from "../../modules/user-accounts/users/api/input-dto/users.input-dto";

const DEFAULT_USER_PASSWORD = "qwerty12345";

export const createTestUsers = async ({
  password,
  count = 1,
}: {
  password?: string;
  count?: number;
}): Promise<UserViewDto[]> => {
  const result: UserViewDto[] = [];

  for (let i = 0; i < count; i++) {
    const uniqueId = Number(Date.now()).toString().substring(8);

    const user: CreateUserInputDto = {
      login: `user${i + 1}${uniqueId}`,
      password: password ?? DEFAULT_USER_PASSWORD,
      email: `email${uniqueId}@test.com`,
    };

    const res = await req
      .post(SETTINGS.PATH.USERS)
      .set("Authorization", testBasicAuthHeader)
      .send(user)
      .expect(201);
    result.push(res.body);
  }

  return result;
};

export const getUsersJwtTokens = async (
  users: UserViewDto[],
): Promise<string[]> => {
  const result: string[] = [];

  for (let i = 0; i < users.length; i++) {
    const authData: { loginOrEmail: string; password: string } = {
      loginOrEmail: users[i].login,
      password: DEFAULT_USER_PASSWORD,
    };

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(authData)
      .expect(200);

    result.push(res.body.accessToken);
  }

  return result;
};
