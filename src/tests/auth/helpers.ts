import { req } from "../helpers";
import { SETTINGS } from "../../settings";
import { RegisterUserInputDto } from "../../modules/user-accounts/auth/api/input-dto/register-user.input-dto";

const DEFAULT_USER_PASSWORD = "qwerty12345";
export const DEFAULT_USER_EMAIL = "test@test.com";

export const registerTestUser = async (
  emails: string[] = [DEFAULT_USER_EMAIL],
) => {
  for (let i = 0; i < emails.length; i++) {
    const uniqueId = Number(Date.now()).toString().substring(8);

    const user: RegisterUserInputDto = {
      login: `user${i + 1}${uniqueId}`,
      password: DEFAULT_USER_PASSWORD,
      email: emails[i],
    };

    await req.post(`${SETTINGS.PATH.AUTH}/registration`).send(user).expect(204);
  }
};
