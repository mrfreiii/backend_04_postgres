import {
  req,
  testBasicAuthHeader,
  connectToTestDBAndClearRepositories,
} from "../helpers";
import { SETTINGS } from "../../settings";
import { createTestUsers } from "../users/helpers";
import { registerTestUser } from "../auth/helpers";
import { createTestBlogs } from "../blogs/helpers";
import { createTestPosts } from "../posts/helpers";

describe("delete all data", () => {
  connectToTestDBAndClearRepositories();

  it("should get default users, post and blog", async () => {
    const user = (await createTestUsers({}))[0];

    const userRes = await req
      .get(SETTINGS.PATH.USERS_ADMIN)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(userRes.body.items).toEqual([user]);
  });

  it("should delete all data", async () => {
    await req.delete(`${SETTINGS.PATH.TESTING}/all-data`).expect(204);

    const userRes = await req
      .get(SETTINGS.PATH.USERS_ADMIN)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);
    expect(userRes.body.items.length).toBe(0);
  });
});

describe("get user registration confirmation code", () => {
  connectToTestDBAndClearRepositories();

  it("should return code", async () => {
    const userEmail = "registration_confirmaion_test@email.com";
    await registerTestUser([userEmail]);

    const res = await req
      .get(`${SETTINGS.PATH.TESTING}/registration-code/${userEmail}`)
      .expect(200);

    expect(res.body.code).toEqual(expect.any(String));
  });
});

describe("get user password recovery code", () => {
  connectToTestDBAndClearRepositories();

  it("should return code", async () => {
    const userEmail = "password_recovery_test@email.com";
    await registerTestUser([userEmail]);

    await req
      .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
      .send({ email: userEmail })
      .expect(204);

    const res = await req
      .get(`${SETTINGS.PATH.TESTING}/password-recovery-code/${userEmail}`)
      .expect(200);

    expect(res.body.code).toEqual(expect.any(String));
  });
});

describe("delete rate limits", () => {
  connectToTestDBAndClearRepositories();

  it("should delete rate limits", async () => {
    await req.delete(`${SETTINGS.PATH.TESTING}/rate-limits`).expect(204);
  });
});
