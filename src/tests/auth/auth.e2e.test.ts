import { add } from "date-fns";

import {
  connectToTestDBAndClearRepositories,
  emailServiceMock,
  mockDate,
  RealDate,
  req,
} from "../helpers";
import { SETTINGS } from "../../settings";
import { deleteRateLimitsData } from "../testing/helpers";
import { DEFAULT_USER_EMAIL, registerTestUser } from "./helpers";
import { createTestUsers, getUsersJwtTokens } from "../users/helpers";
import { UserViewDto } from "../../modules/user-accounts/users/api/view-dto/users.view-dto";
import { RegisterUserInputDto } from "../../modules/user-accounts/auth/api/input-dto/register-user.input-dto";

const validConfirmationOrRecoveryCode = "999888777";
jest.mock("uuid", () => ({
  v4: () => {
    return validConfirmationOrRecoveryCode;
  },
}));

describe("register user /registration", () => {
  connectToTestDBAndClearRepositories();

  beforeEach(async () => {
    await deleteRateLimitsData();
  });

  it("should return 400 for login, password, and email are not string", async () => {
    const newUser: RegisterUserInputDto = {
      login: null as unknown as string,
      password: null as unknown as string,
      email: null as unknown as string,
    };

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/registration`)
      .send(newUser)
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(3);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "login",
        message:
          "login must match /^[a-zA-Z0-9_-]*$/ regular expression; Received value: null",
      },
      {
        field: "password",
        message:
          "password must be longer than or equal to 6 characters; Received value: null",
      },
      {
        field: "email",
        message: "email must be an email; Received value: null",
      },
    ]);
  });

  it("should register a user", async () => {
    const newUser: RegisterUserInputDto = {
      login: "userLogin",
      password: "userPassword",
      email: "user@email.com",
    };

    await req
      .post(`${SETTINGS.PATH.AUTH}/registration`)
      .send(newUser)
      .expect(204);

    expect(emailServiceMock.sendEmailWithConfirmationCode).toHaveBeenCalled();
    expect(
      emailServiceMock.sendEmailWithConfirmationCode,
    ).toHaveBeenCalledTimes(1);
  });

  it("should return 400 for user with same email", async () => {
    await registerTestUser();

    const newUser: RegisterUserInputDto = {
      login: "userLogin1",
      password: "userPassword",
      email: DEFAULT_USER_EMAIL,
    };

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/registration`)
      .send(newUser)
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(1);
    expect(res.body.errorsMessages[0]).toEqual({
      field: "email",
      message: "User with the same email already exists",
    });
  });

  it("should return 429 for 6th attempt during 10 seconds", async () => {
    const newUser1: { login: string; email: string; password: string } = {
      login: "user1Login",
      password: "user1Password",
      email: "user1@email.com",
    };
    const newUser2: { login: string; email: string; password: string } = {
      login: "user2Login",
      password: "user2Password",
      email: "user2@email.com",
    };
    const newUser3: { login: string; email: string; password: string } = {
      login: "user3Login",
      password: "user3Password",
      email: "user3@email.com",
    };
    const newUser4: { login: string; email: string; password: string } = {
      login: "user4Login",
      password: "user4Password",
      email: "user4@email.com",
    };
    const newUser5: { login: string; email: string; password: string } = {
      login: "user5Login",
      password: "user5Password",
      email: "user5@email.com",
    };
    const newUser6: { login: string; email: string; password: string } = {
      login: "user6Login",
      password: "user6Password",
      email: "user6@email.com",
    };

    // attempt #1
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration`)
      .send(newUser1)
      .expect(204);
    // attempt #2
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration`)
      .send(newUser2)
      .expect(204);
    // attempt #3
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration`)
      .send(newUser3)
      .expect(204);
    // attempt #4
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration`)
      .send(newUser4)
      .expect(204);
    // attempt #5
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration`)
      .send(newUser5)
      .expect(204);
    // attempt #6
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration`)
      .send(newUser6)
      .expect(429);
  });
});

describe("confirm user registration /registration-confirmation", () => {
  connectToTestDBAndClearRepositories();

  beforeAll(async () => {
    await registerTestUser();
  });

  beforeEach(async () => {
    await deleteRateLimitsData();
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  it("should return 400 for code not a string", async () => {
    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
      .send({ code: 777 })
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(1);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "code",
        message: "code must be a string; Received value: 777",
      },
    ]);
  });

  it("should return 400 for invalid confirmation code", async () => {
    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
      .send({ code: "00000" })
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(1);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "code",
        message: "Invalid confirmation code",
      },
    ]);
  });

  it("should return 400 for code expiration", async () => {
    mockDate("2098-11-25T12:34:56z");

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
      .send({ code: validConfirmationOrRecoveryCode })
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(1);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "code",
        message: "Confirmation code expired",
      },
    ]);
  });

  it("should return 204 for correct confirmation code", async () => {
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
      .send({ code: validConfirmationOrRecoveryCode })
      .expect(204);
  });

  it("should return 429 for 6th attempt and 400 after waiting 10sec", async () => {
    // attempt #1
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
      .send({ code: "00000" })
      .expect(400);

    // attempt #2
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
      .send({ code: "00000" })
      .expect(400);

    // attempt #3
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
      .send({ code: "00000" })
      .expect(400);

    // attempt #4
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
      .send({ code: "00000" })
      .expect(400);

    // attempt #5
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
      .send({ code: "00000" })
      .expect(400);

    // attempt #6
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
      .send({ code: "00000" })
      .expect(429);

    const dateInFuture = add(new Date(), {
      seconds: 10,
    });
    mockDate(dateInFuture.toISOString());

    // attempt #7 after waiting
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
      .send({ code: "00000" })
      .expect(400);
  });
});

describe("resend registration email /registration-email-resending", () => {
  connectToTestDBAndClearRepositories();

  const user1Email = "user1@email.com";
  const user2Email = "user2@email.com";

  beforeAll(async () => {
    await registerTestUser([user1Email, user2Email]);
  });

  beforeEach(async () => {
    await deleteRateLimitsData();
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  it("should return 400 for invalid email format", async () => {
    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
      .send({ email: "qwerty" })
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(1);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "email",
        message: "email must be an email; Received value: qwerty",
      },
    ]);
  });

  it("should return 400 for unregistered email", async () => {
    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
      .send({ email: "qwerty@test.com" })
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(1);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "email",
        message: "User not found",
      },
    ]);
  });

  it("should return 400 for already confirmed email", async () => {
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
      .send({ code: validConfirmationOrRecoveryCode })
      .expect(204);

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
      .send({ email: user1Email })
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(1);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "email",
        message: "Email already confirmed",
      },
    ]);
  });

  it("should resend email", async () => {
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
      .send({ email: user2Email })
      .expect(204);

    expect(emailServiceMock.sendEmailWithConfirmationCode).toHaveBeenCalled();
    expect(
      emailServiceMock.sendEmailWithConfirmationCode,
    ).toHaveBeenCalledTimes(3);
  });

  it("should return 429 for 6th request and 400 after waiting 10 sec", async () => {
    // attempt #1
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
      .send({ email: "qwerty" })
      .expect(400);

    // attempt #2
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
      .send({ email: "qwerty" })
      .expect(400);

    // attempt #3
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
      .send({ email: "qwerty" })
      .expect(400);

    // attempt #4
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
      .send({ email: "qwerty" })
      .expect(400);

    // attempt #5
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
      .send({ email: "qwerty" })
      .expect(400);

    // attempt #6
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
      .send({ email: "qwerty" })
      .expect(429);

    const dateInFuture = add(new Date(), {
      seconds: 10,
    });
    mockDate(dateInFuture.toISOString());

    // attempt #7
    await req
      .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
      .send({ email: "qwerty" })
      .expect(400);
  });
});

describe("send password recovery code /password-recovery", () => {
  connectToTestDBAndClearRepositories();

  const userEmail = "user1@email.com";

  beforeAll(async () => {
    await registerTestUser([userEmail]);
  });

  beforeEach(async () => {
    await deleteRateLimitsData();
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  it("should return 400 for invalid email format", async () => {
    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
      .send({ email: "qwerty" })
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(1);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "email",
        message: "email must be an email; Received value: qwerty",
      },
    ]);
  });

  it("should return 204 for unregistered email", async () => {
    await req
      .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
      .send({ email: "qwerty@test.com" })
      .expect(204);

    expect(
      emailServiceMock.sendEmailWithPasswordRecoveryCode,
    ).not.toHaveBeenCalled();
  });

  it("should send email", async () => {
    await req
      .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
      .send({ email: userEmail })
      .expect(204);

    expect(
      emailServiceMock.sendEmailWithPasswordRecoveryCode,
    ).toHaveBeenCalled();
    expect(
      emailServiceMock.sendEmailWithPasswordRecoveryCode,
    ).toHaveBeenCalledTimes(1);
  });

  it("should return 429 for 6th request and 400 after waiting 10 sec", async () => {
    // attempt #1
    await req
      .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
      .send({ email: "qwerty" })
      .expect(400);

    // attempt #2
    await req
      .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
      .send({ email: "qwerty" })
      .expect(400);

    // attempt #3
    await req
      .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
      .send({ email: "qwerty" })
      .expect(400);

    // attempt #4
    await req
      .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
      .send({ email: "qwerty" })
      .expect(400);

    // attempt #5
    await req
      .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
      .send({ email: "qwerty" })
      .expect(400);

    // attempt #6
    await req
      .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
      .send({ email: "qwerty" })
      .expect(429);

    const dateInFuture = add(new Date(), {
      seconds: 10,
    });
    mockDate(dateInFuture.toISOString());

    // attempt #7
    await req
      .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
      .send({ email: "qwerty" })
      .expect(400);
  });
});

describe("confirm password recovery /new-password", () => {
  connectToTestDBAndClearRepositories();

  const userEmail = "user1@email.com";

  beforeAll(async () => {
    await registerTestUser([userEmail]);

    await req
      .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
      .send({ email: userEmail })
      .expect(204);
  });

  beforeEach(async () => {
    await deleteRateLimitsData();
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  it("should return 400 for invalid newPassword and recoveryCode format", async () => {
    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/new-password`)
      .send({ newPassword: 123, recoveryCode: 123 })
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(2);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "newPassword",
        message:
          "newPassword must be longer than or equal to 6 and shorter than or equal to 20 characters; Received value: 123",
      },
      {
        field: "recoveryCode",
        message: "recoveryCode must be a string; Received value: 123",
      },
    ]);
  });

  it("should return 400 for expiration of recovery code", async () => {
    const dateInFuture = add(new Date(), {
      minutes: 10,
    });
    mockDate(dateInFuture.toISOString());

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/new-password`)
      .send({
        newPassword: "1234567",
        recoveryCode: validConfirmationOrRecoveryCode,
      })
      .expect(400);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "recoveryCode",
      message: "Code expired",
    });
  });

  it("should confirm password recovery", async () => {
    const newPassword = "999988887777";

    await req
      .post(`${SETTINGS.PATH.AUTH}/new-password`)
      .send({
        newPassword: newPassword,
        recoveryCode: validConfirmationOrRecoveryCode,
      })
      .expect(204);

    const authData: { loginOrEmail: string; password: string } = {
      loginOrEmail: userEmail,
      password: newPassword,
    };
    await req.post(`${SETTINGS.PATH.AUTH}/login`).send(authData).expect(200);
  });

  it("should return 429 for 6th request and 400 after waiting 10 sec", async () => {
    // attempt #1
    await req
      .post(`${SETTINGS.PATH.AUTH}/new-password`)
      .send({ newPassword: "qwerty", recoveryCode: "12345" })
      .expect(400);

    // attempt #2
    await req
      .post(`${SETTINGS.PATH.AUTH}/new-password`)
      .send({ newPassword: "qwerty", recoveryCode: "12345" })
      .expect(400);

    // attempt #3
    await req
      .post(`${SETTINGS.PATH.AUTH}/new-password`)
      .send({ newPassword: "qwerty", recoveryCode: "12345" })
      .expect(400);

    // attempt #4
    await req
      .post(`${SETTINGS.PATH.AUTH}/new-password`)
      .send({ newPassword: "qwerty", recoveryCode: "12345" })
      .expect(400);

    // attempt #5
    await req
      .post(`${SETTINGS.PATH.AUTH}/new-password`)
      .send({ newPassword: "qwerty", recoveryCode: "12345" })
      .expect(400);

    // attempt #6
    await req
      .post(`${SETTINGS.PATH.AUTH}/new-password`)
      .send({ newPassword: "qwerty", recoveryCode: "12345" })
      .expect(429);

    const dateInFuture = add(new Date(), {
      seconds: 10,
    });
    mockDate(dateInFuture.toISOString());

    // attempt #7
    await req
      .post(`${SETTINGS.PATH.AUTH}/new-password`)
      .send({ newPassword: "qwerty", recoveryCode: "12345" })
      .expect(400);
  });
});

describe("login user /login", () => {
  connectToTestDBAndClearRepositories();

  const userPassword = "1234567890";
  let createdUser: UserViewDto;

  beforeAll(async () => {
    createdUser = (await createTestUsers({ password: userPassword }))[0];
  });

  beforeEach(async () => {
    await deleteRateLimitsData();
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  // it("should return 400 for loginOrEmail and password are not string", async () => {
  //   const authData: { loginOrEmail: null; password: null } = {
  //     loginOrEmail: null,
  //     password: null,
  //   };
  //
  //   const res = await req
  //     .post(`${SETTINGS.PATH.AUTH}/login`)
  //     .send(authData)
  //     .expect(400);
  //
  //   expect(res.body.errorsMessages.length).toBe(2);
  //   expect(res.body.errorsMessages).toEqual([
  //     {
  //       field: "loginOrEmail",
  //       message: "value must be a string",
  //     },
  //     {
  //       field: "password",
  //       message: "value must be a string",
  //     },
  //   ]);
  // });

  it("should login user by login", async () => {
    const authData: { loginOrEmail: string; password: string } = {
      loginOrEmail: createdUser.login,
      password: userPassword,
    };

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(authData)
      .expect(200);

    const refreshToken = (res.header["set-cookie"] as unknown as Array<string>)
      ?.find((header) => header.startsWith("refreshToken="))
      ?.split("=")[1];

    expect(res.body).toEqual({ accessToken: expect.any(String) });
    expect(refreshToken).toStrictEqual(expect.any(String));
  });

  it("should login user by email", async () => {
    const authData: { loginOrEmail: string; password: string } = {
      loginOrEmail: createdUser.email,
      password: userPassword,
    };

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(authData)
      .expect(200);
    expect(res.body).toEqual({ accessToken: expect.any(String) });
  });

  it("should return 401 for invalid password", async () => {
    const authData: { loginOrEmail: string; password: string } = {
      loginOrEmail: createdUser.email,
      password: "invalid password",
    };

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(authData)
      .expect(401);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Invalid username or password",
    });
  });

  it("should return 401 for non existent user", async () => {
    const authData: { loginOrEmail: string; password: string } = {
      loginOrEmail: "noExist",
      password: userPassword,
    };

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(authData)
      .expect(401);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Invalid username or password",
    });
  });

  it("should return 429 for 6th request during 10 seconds (rate limit) and 401 after waiting", async () => {
    const nonExistentUser: { loginOrEmail: string; password: string } = {
      loginOrEmail: "noExist",
      password: userPassword,
    };

    // attempt #1
    await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(nonExistentUser)
      .expect(401);

    // attempt #2
    await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(nonExistentUser)
      .expect(401);

    // attempt #3
    await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(nonExistentUser)
      .expect(401);

    // attempt #4
    await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(nonExistentUser)
      .expect(401);

    // attempt #5
    await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(nonExistentUser)
      .expect(401);

    // attempt #6
    const errorRes = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(nonExistentUser)
      .expect(429);

    expect(errorRes.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Too many requests",
    });

    const dateInFuture = add(new Date(), {
      seconds: 11,
    });
    mockDate(dateInFuture.toISOString());

    // attempt #7
    await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(nonExistentUser)
      .expect(401);
  });
});

describe("check user /me", () => {
  connectToTestDBAndClearRepositories();

  let createdUser: UserViewDto;
  let userToken: string;

  beforeAll(async () => {
    createdUser = (await createTestUsers({}))[0];
    userToken = (await getUsersJwtTokens([createdUser]))[0];
  });

  it("should return 401 for request without auth header", async () => {
    await req.get(`${SETTINGS.PATH.AUTH}/me`).expect(401);
  });

  it("should return 401 for invalid auth header", async () => {
    await req
      .get(`${SETTINGS.PATH.AUTH}/me`)
      .set("Authorization", "Basic 1234567890")
      .expect(401);
  });

  it("should return 401 for invalid jwt token", async () => {
    await req
      .get(`${SETTINGS.PATH.AUTH}/me`)
      .set("Authorization", "Bearer 1234567890")
      .expect(401);
  });

  it("should return user info", async () => {
    const res = await req
      .get(`${SETTINGS.PATH.AUTH}/me`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toEqual({
      email: createdUser.email,
      login: createdUser.login,
      userId: createdUser.id,
    });
  });

  it("should return 401 for expired token", async () => {
    const dateInFuture = add(new Date(), {
      hours: 1,
    });
    mockDate(dateInFuture.toISOString());

    await req
      .get(`${SETTINGS.PATH.AUTH}/me`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(401);
  });
});

describe("refresh token /refresh-token", () => {
  connectToTestDBAndClearRepositories();

  const userPassword = "1234567890";
  let createdUser: UserViewDto;

  let authData: { loginOrEmail: string; password: string };
  let cookieWithRefreshToken: string;

  beforeAll(async () => {
    createdUser = (await createTestUsers({ password: userPassword }))[0];

    authData = {
      loginOrEmail: createdUser.login,
      password: userPassword,
    };
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  it("should return 401 for no refresh token in cookie", async () => {
    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/refresh-token`)
      .expect(401);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "There is no cookie with refresh token",
    });
  });

  it("should return 401 for invalid refresh token", async () => {
    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/refresh-token`)
      .set("Cookie", ["refreshToken=12345667"])
      .expect(401);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Invalid refresh token in cookie",
    });
  });

  it("should update refresh token", async () => {
    const loginRes = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(authData)
      .expect(200);

    const refreshRes = await req
      .post(`${SETTINGS.PATH.AUTH}/refresh-token`)
      .set("cookie", loginRes.headers["set-cookie"])
      .expect(200);

    cookieWithRefreshToken = refreshRes.headers["set-cookie"];
  });

  it("should return 401 for outdated refresh token", async () => {
    const dateInFuture = add(new Date(), {
      hours: 1,
    });
    mockDate(dateInFuture.toISOString());

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/refresh-token`)
      .set("cookie", cookieWithRefreshToken)
      .expect(401);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Invalid refresh token in cookie",
    });
  });
});

describe("logout /logout", () => {
  connectToTestDBAndClearRepositories();

  const userPassword = "1234567890";
  let createdUser: UserViewDto;

  let authData: { loginOrEmail: string; password: string };
  let cookieWithValidRefreshToken: string;

  beforeAll(async () => {
    createdUser = (await createTestUsers({ password: userPassword }))[0];

    authData = {
      loginOrEmail: createdUser.login,
      password: userPassword,
    };
  });

  it("should return 401 for no refresh token in cookie", async () => {
    const res = await req.post(`${SETTINGS.PATH.AUTH}/logout`).expect(401);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "There is no cookie with refresh token",
    });
  });

  it("should return 401 for invalid refresh token", async () => {
    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/logout`)
      .set("Cookie", ["refreshToken=12345667"])
      .expect(401);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Invalid refresh token in cookie",
    });
  });

  it("should return 401 for outdated refresh token", async () => {
    const loginRes = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .send(authData)
      .expect(200);
    const cookieWithOutdatedRefreshToken = loginRes.headers["set-cookie"];

    const refreshRes = await req
      .post(`${SETTINGS.PATH.AUTH}/refresh-token`)
      .set("Cookie", loginRes.headers["set-cookie"])
      .expect(200);
    cookieWithValidRefreshToken = refreshRes.headers["set-cookie"];

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/logout`)
      .set("cookie", cookieWithOutdatedRefreshToken)
      .expect(401);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Session is invalid",
    });
  });

  it("should logout user", async () => {
    await req
      .post(`${SETTINGS.PATH.AUTH}/logout`)
      .set("Cookie", cookieWithValidRefreshToken)
      .expect(204);
  });
});
