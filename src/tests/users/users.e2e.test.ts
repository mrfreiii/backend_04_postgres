import { SETTINGS } from "../../settings";
import { createTestUsers } from "./helpers";
import {
  connectToTestDBAndClearRepositories,
  req,
  testBasicAuthHeader,
} from "../helpers";
import { convertObjectToQueryString } from "../../utils/convertObjectToQueryString";
import { UserViewDto } from "../../modules/user-accounts/users/api/view-dto/users.view-dto";
import { CreateUserInputDto } from "../../modules/user-accounts/users/api/input-dto/users.input-dto";
import { GetUsersQueryParams } from "../../modules/user-accounts/users/api/input-dto/get-users-query-params.input-dto";

describe("create user /users", () => {
  connectToTestDBAndClearRepositories();

  it("should return 401 for request without basic auth header", async () => {
    await req.post(SETTINGS.PATH.USERS).send({}).expect(401);
  });

  it("should create a user", async () => {
    const newUser: CreateUserInputDto = {
      login: "userLogin",
      password: "userPassword",
      email: "user@email.com",
    };

    const res = await req
      .post(SETTINGS.PATH.USERS)
      .set("Authorization", testBasicAuthHeader)
      .send(newUser)
      .expect(201);

    expect(res.body).toEqual({
      login: newUser.login,
      email: newUser.email,
      id: expect.any(String),
      createdAt: expect.any(String),
    });
  });

  it("should return 400 for creating user with same login", async () => {
    const newUser1: CreateUserInputDto = {
      login: "user1Login",
      password: "user1Password",
      email: "user1@email.com",
    };
    await req
      .post(SETTINGS.PATH.USERS)
      .set("Authorization", testBasicAuthHeader)
      .send(newUser1)
      .expect(201);

    const newUser2: CreateUserInputDto = {
      login: newUser1.login,
      password: "user2Password",
      email: "user2@email.com",
    };

    const res = await req
      .post(SETTINGS.PATH.USERS)
      .set("Authorization", testBasicAuthHeader)
      .send(newUser2)
      .expect(400);

    expect(res?.body?.errorsMessages?.length).toBe(1);
    expect(res?.body?.errorsMessages).toEqual([
      {
        field: "login",
        message: "User with the same login already exists",
      },
    ]);
  });

  it("should return 400 for creating user with same email", async () => {
    const newUser1: CreateUserInputDto = {
      login: "user111",
      password: "user111",
      email: "user111@email.com",
    };
    await req
      .post(SETTINGS.PATH.USERS)
      .set("Authorization", testBasicAuthHeader)
      .send(newUser1)
      .expect(201);

    const newUser2: CreateUserInputDto = {
      login: "user222",
      password: "user222",
      email: newUser1.email,
    };

    const res = await req
      .post(SETTINGS.PATH.USERS)
      .set("Authorization", testBasicAuthHeader)
      .send(newUser2)
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(1);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "email",
        message: "User with the same email already exists",
      },
    ]);
  });
});

describe("get all /users", () => {
  connectToTestDBAndClearRepositories();

  let createdUsers: UserViewDto[] = [];

  it("should return 401 for request without basic auth header", async () => {
    await req.get(SETTINGS.PATH.USERS).expect(401);
  });

  it("should get empty array", async () => {
    const res = await req
      .get(SETTINGS.PATH.USERS)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(res.body.pagesCount).toBe(0);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(0);
    expect(res.body.items.length).toBe(0);
  });

  it("should get not empty array without query params", async () => {
    createdUsers = await createTestUsers({ count: 2 });

    const res = await req
      .get(SETTINGS.PATH.USERS)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(res.body.pagesCount).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.items.length).toBe(2);

    expect(res.body.items).toEqual([createdUsers[1], createdUsers[0]]);
  });

  it("should get 1 user with searchName query", async () => {
    const query: Pick<GetUsersQueryParams, "searchLoginTerm"> = {
      searchLoginTerm: createdUsers[0].login,
    };
    const queryString = convertObjectToQueryString(query);

    const res = await req
      .get(`${SETTINGS.PATH.USERS}${queryString}`)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(res.body.pagesCount).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(1);
    expect(res.body.items.length).toBe(1);

    expect(res.body.items[0]).toEqual(createdUsers[0]);
  });
});

describe("delete user by id /users", () => {
  connectToTestDBAndClearRepositories();

  let userForDeletion: UserViewDto;

  it("should get not empty array", async () => {
    userForDeletion = (await createTestUsers({}))[0];

    const res = await req
      .get(SETTINGS.PATH.USERS)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(res.body.items[0]).toEqual(userForDeletion);
  });

  it("should return 401 for request without basic auth header", async () => {
    await req.delete(`${SETTINGS.PATH.USERS}/77777`).expect(401);
  });

  it("should return 404 for non existent user", async () => {
    await req
      .delete(`${SETTINGS.PATH.USERS}/77777`)
      .set("Authorization", testBasicAuthHeader)
      .expect(404);
  });

  it("should delete user and get empty array", async () => {
    await req
      .delete(`${SETTINGS.PATH.USERS}/${userForDeletion?.id}`)
      .set("Authorization", testBasicAuthHeader)
      .expect(204);

    const res = await req
      .get(SETTINGS.PATH.USERS)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(res.body.pagesCount).toBe(0);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(0);
    expect(res.body.items.length).toBe(0);
  });
});
