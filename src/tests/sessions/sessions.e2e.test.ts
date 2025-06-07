import {
  connectToTestDBAndClearRepositories,
  delayInSec,
  req,
} from "../helpers";
import { SETTINGS } from "../../settings";
import { createTestUsers } from "../users/helpers";
import { getDeviceIdFromRefreshTokenCookie } from "./helpers";
import { UserViewDto } from "../../modules/user-accounts/users/api/view-dto/users.view-dto";

describe("sessions /devices", () => {
  connectToTestDBAndClearRepositories();

  const userPassword = "1234567890";
  let createdUser: UserViewDto;
  let authData: { loginOrEmail: string; password: string };

  let cookieWithRefreshTokenDevice1: string;
  let cookieWithRefreshTokenDevice4: string;

  let deviceId1: string;
  let deviceId2: string;
  let deviceId3: string;
  let deviceId4: string;

  let lastActiveDate1stDevice: string;

  beforeAll(async () => {
    createdUser = (await createTestUsers({ password: userPassword }))[0];

    authData = {
      loginOrEmail: createdUser.login,
      password: userPassword,
    };
  });

  it("should return 401 for request without refresh token", async () => {
    await req.get(`${SETTINGS.PATH.SESSIONS}`).expect(401);
  });

  it("should get 4 sessions", async () => {
    // session #1
    const res1 = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .set(
        "User-Agent",
        "Mozilla/5.0 (Linux i651 ; en-US) AppleWebKit/602.33 (KHTML, like Gecko) Chrome/53.0.1935.131 Safari/533",
      )
      .send(authData)
      .expect(200);

    // session #2
    const res2 = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .set(
        "User-Agent",
        "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_9_6; en-US) Gecko/20130401 Firefox/58.2",
      )
      .send(authData)
      .expect(200);

    // session #3
    const res3 = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .set(
        "User-Agent",
        "Mozilla/5.0 (iPad; CPU iPad OS 11_1_3 like Mac OS X) AppleWebKit/536.14 (KHTML, like Gecko) Chrome/51.0.1700.324 Mobile Safari/602.0",
      )
      .send(authData)
      .expect(200);

    // session #4
    const res4 = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .set(
        "User-Agent",
        "Mozilla/5.0 (Windows; U; Windows NT 10.1; x64; en-US) AppleWebKit/534.34 (KHTML, like Gecko) Chrome/49.0.2605.271 Safari/602.5 Edge/9.21230",
      )
      .send(authData)
      .expect(200);

    deviceId1 = getDeviceIdFromRefreshTokenCookie(res1.headers["set-cookie"]);
    deviceId2 = getDeviceIdFromRefreshTokenCookie(res2.headers["set-cookie"]);
    deviceId3 = getDeviceIdFromRefreshTokenCookie(res3.headers["set-cookie"]);
    deviceId4 = getDeviceIdFromRefreshTokenCookie(res4.headers["set-cookie"]);

    cookieWithRefreshTokenDevice1 = res1.headers["set-cookie"];
    cookieWithRefreshTokenDevice4 = res4.headers["set-cookie"];

    const sessions = await req
      .get(`${SETTINGS.PATH.SESSIONS}`)
      .set("Cookie", cookieWithRefreshTokenDevice1)
      .expect(200);

    lastActiveDate1stDevice = sessions.body[0].lastActiveDate;

    expect(sessions.body).toEqual([
      {
        deviceId: deviceId1,
        ip: expect.any(String),
        lastActiveDate: lastActiveDate1stDevice,
        title: "Browser: Chrome 53.0.1935.131; OS: Linux i651",
      },
      {
        deviceId: deviceId2,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Firefox 58.2; OS: macOS 10.9.6",
      },
      {
        deviceId: deviceId3,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Mobile Chrome 51.0.1700.324; OS: iOS 11.1.3",
      },
      {
        deviceId: deviceId4,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Edge 9.21230; OS: Windows NT 10.1",
      },
    ]);
  });

  it("should update lastActiveDate after refresh token", async () => {
    await delayInSec(1);

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/refresh-token`)
      .set("Cookie", cookieWithRefreshTokenDevice1)
      .set(
        "User-Agent",
        "Mozilla/5.0 (Linux i651 ; en-US) AppleWebKit/602.33 (KHTML, like Gecko) Chrome/53.0.1935.131 Safari/533",
      )
      .expect(200);

    cookieWithRefreshTokenDevice1 = res.headers["set-cookie"];

    const sessions = await req
      .get(`${SETTINGS.PATH.SESSIONS}`)
      .set("cookie", cookieWithRefreshTokenDevice1)
      .expect(200);

    expect(sessions.body).toEqual([
      {
        deviceId: deviceId1,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Chrome 53.0.1935.131; OS: Linux i651",
      },
      {
        deviceId: deviceId2,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Firefox 58.2; OS: macOS 10.9.6",
      },
      {
        deviceId: deviceId3,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Mobile Chrome 51.0.1700.324; OS: iOS 11.1.3",
      },
      {
        deviceId: deviceId4,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Edge 9.21230; OS: Windows NT 10.1",
      },
    ]);

    expect(sessions.body[0].lastActiveDate).not.toBe(lastActiveDate1stDevice);
  });

  it("should delete device after logout", async () => {
    await req
      .post(`${SETTINGS.PATH.AUTH}/logout`)
      .set("Cookie", cookieWithRefreshTokenDevice4)
      .expect(204);

    const sessions = await req
      .get(`${SETTINGS.PATH.SESSIONS}`)
      .set("Cookie", cookieWithRefreshTokenDevice1)
      .expect(200);

    expect(sessions.body).toEqual([
      {
        deviceId: deviceId1,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Chrome 53.0.1935.131; OS: Linux i651",
      },
      {
        deviceId: deviceId2,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Firefox 58.2; OS: macOS 10.9.6",
      },
      {
        deviceId: deviceId3,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Mobile Chrome 51.0.1700.324; OS: iOS 11.1.3",
      },
    ]);
  });

  it("should return 401 for request without refresh token - DELETE /devices/{deviceId}", async () => {
    await req.delete(`${SETTINGS.PATH.SESSIONS}/123`).expect(401);
  });

  it("should return 401 for request with invalid refresh token - DELETE /devices/{deviceId}", async () => {
    await req
      .delete(`${SETTINGS.PATH.SESSIONS}/123`)
      .set("Cookie", ["refreshToken=12345667"])
      .expect(401);
  });

  it("should return 404 for non existent device - DELETE /devices/{deviceId}", async () => {
    await req
      .delete(`${SETTINGS.PATH.SESSIONS}/123`)
      .set("Cookie", cookieWithRefreshTokenDevice1)
      .expect(404);
  });

  it("should return 403 for device of another user - DELETE /devices/{deviceId}", async () => {
    const createdUser2 = (await createTestUsers({ password: userPassword }))[0];
    const authDataAnotherUser = {
      loginOrEmail: createdUser2.login,
      password: userPassword,
    };

    const res = await req
      .post(`${SETTINGS.PATH.AUTH}/login`)
      .set(
        "User-Agent",
        "Mozilla/5.0 (Linux i651 ; en-US) AppleWebKit/602.33 (KHTML, like Gecko) Chrome/53.0.1935.131 Safari/533",
      )
      .send(authDataAnotherUser)
      .expect(200);
    const deviceIdUser2 = getDeviceIdFromRefreshTokenCookie(
      res.headers["set-cookie"],
    );

    await req
      .delete(`${SETTINGS.PATH.SESSIONS}/${deviceIdUser2}`)
      .set("Cookie", cookieWithRefreshTokenDevice1)
      .expect(403);
  });

  it("should delete device - DELETE /devices/{deviceId}", async () => {
    await req
      .delete(`${SETTINGS.PATH.SESSIONS}/${deviceId2}`)
      .set("Cookie", cookieWithRefreshTokenDevice1)
      .expect(204);

    const sessions = await req
      .get(`${SETTINGS.PATH.SESSIONS}`)
      .set("Cookie", cookieWithRefreshTokenDevice1)
      .expect(200);

    expect(sessions.body).toEqual([
      {
        deviceId: deviceId1,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Chrome 53.0.1935.131; OS: Linux i651",
      },
      {
        deviceId: deviceId3,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Mobile Chrome 51.0.1700.324; OS: iOS 11.1.3",
      },
    ]);
  });

  it("should delete all other devices - DELETE /devices", async () => {
    await req
      .delete(SETTINGS.PATH.SESSIONS)
      .set("Cookie", cookieWithRefreshTokenDevice1)
      .expect(204);

    const sessions = await req
      .get(SETTINGS.PATH.SESSIONS)
      .set("Cookie", cookieWithRefreshTokenDevice1)
      .expect(200);

    expect(sessions.body).toEqual([
      {
        deviceId: deviceId1,
        ip: expect.any(String),
        lastActiveDate: expect.any(String),
        title: "Browser: Chrome 53.0.1935.131; OS: Linux i651",
      },
    ]);
  });
});
