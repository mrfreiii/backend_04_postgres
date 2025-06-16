import { SETTINGS } from "../../settings";
import { createTestBlogs, createTestPostsByBlog } from "./helpers";
import {
  connectToTestDBAndClearRepositories,
  req,
  testBasicAuthHeader,
} from "../helpers";
import { convertObjectToQueryString } from "../../utils/convertObjectToQueryString";

import { SortDirection } from "../../core/dto/base.query-params.input-dto";
import { PostViewDtoPg } from "../../modules/bloggers-platform/posts/api/view-dto/posts.view-dto.pg";
import { BlogViewDtoPg } from "../../modules/bloggers-platform/blogs/api/view-dto/blogs.view-dto.pg";
import { GetBlogsQueryParams } from "../../modules/bloggers-platform/blogs/api/input-dto/get-blogs-query-params.input-dto";
import { UserViewDtoPg } from "../../modules/user-accounts/users/api/view-dto/users.view-dto.pg";
import { createTestUsers, getUsersJwtTokens } from "../users/helpers";

describe("get all blogs /blogs", () => {
  connectToTestDBAndClearRepositories();

  let createdBlogs: BlogViewDtoPg[] = [];

  it("should get empty array", async () => {
    const res = await req.get(SETTINGS.PATH.BLOGS_PUBLIC).expect(200);

    expect(res.body.pagesCount).toBe(0);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(0);
    expect(res.body.items.length).toBe(0);
  });

  it("should get not empty array without query params", async () => {
    createdBlogs = await createTestBlogs(2);

    const res = await req.get(SETTINGS.PATH.BLOGS_PUBLIC).expect(200);

    expect(res.body.pagesCount).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.items.length).toBe(2);

    expect(res.body.items).toEqual([createdBlogs[1], createdBlogs[0]]);
  });

  it("should get 2 blogs with searchName query", async () => {
    const query: Partial<GetBlogsQueryParams> = {
      searchNameTerm: "og",
    };
    const queryString = convertObjectToQueryString(query);

    const res = await req
      .get(`${SETTINGS.PATH.BLOGS_PUBLIC}${queryString}`)
      .expect(200);

    expect(res.body.pagesCount).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.items.length).toBe(2);

    expect(res.body.items).toEqual([createdBlogs[1], createdBlogs[0]]);
  });

  it("should get 2 blogs with sortDirection asc", async () => {
    const query: Partial<GetBlogsQueryParams> = {
      sortDirection: SortDirection.Asc,
    };
    const queryString = convertObjectToQueryString(query);

    const res = await req
      .get(`${SETTINGS.PATH.BLOGS_PUBLIC}${queryString}`)
      .expect(200);

    expect(res.body.pagesCount).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.items.length).toBe(2);

    expect(res.body.items).toEqual([createdBlogs[0], createdBlogs[1]]);
  });

  it("should get 2 blogs with page number and page size", async () => {
    const query: Partial<GetBlogsQueryParams> = {
      pageNumber: 2,
      pageSize: 1,
    };
    const queryString = convertObjectToQueryString(query);

    const res = await req
      .get(`${SETTINGS.PATH.BLOGS_PUBLIC}${queryString}`)
      .expect(200);

    expect(res.body.pagesCount).toBe(2);
    expect(res.body.page).toBe(2);
    expect(res.body.pageSize).toBe(1);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.items.length).toBe(1);

    expect(res.body.items[0]).toEqual(createdBlogs[0]);
  });
});

describe("get posts by blogId /blogs/:id/posts", () => {
  connectToTestDBAndClearRepositories();

  let createdPosts: PostViewDtoPg[];

  let user: UserViewDtoPg;
  let userToken: string;

  beforeAll(async () => {
    createdPosts = await createTestPostsByBlog(2);

    const createdUsers = await createTestUsers({});
    user = createdUsers[0];

    const usersTokens = await getUsersJwtTokens(createdUsers);
    userToken = usersTokens[0];

    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPosts[0].id}/like-status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ likeStatus: "Like" })
      .expect(204);
  });

  it("should return 404 for non existent blog", async () => {
    const res = await req
      .get(`${SETTINGS.PATH.BLOGS_PUBLIC}/123777/posts`)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Blog not found",
    });
  });

  it("should get posts with 'None' like-status for all posts for unauthorized user", async () => {
    const res = await req
      .get(`${SETTINGS.PATH.BLOGS_PUBLIC}/${createdPosts[0].blogId}/posts`)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(res.body.pagesCount).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.items.length).toBe(2);

    expect(res.body.items).toEqual([
      createdPosts[1],
      {
        ...createdPosts[0],
        extendedLikesInfo: {
          likesCount: 1,
          dislikesCount: 0,
          myStatus: "None",
          newestLikes: [
            {
              addedAt: expect.any(String),
              login: user.login,
              userId: user.id,
            },
          ],
        },
      },
    ]);
  });

  it("should get posts with 'Like' like-status for liked post for authorized user", async () => {
    const res = await req
      .get(`${SETTINGS.PATH.BLOGS_PUBLIC}/${createdPosts[0]?.blogId}/posts`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.pagesCount).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.items.length).toBe(2);

    expect(res.body.items).toEqual([
      createdPosts[1],
      {
        ...createdPosts[0],
        extendedLikesInfo: {
          likesCount: 1,
          dislikesCount: 0,
          myStatus: "Like",
          newestLikes: [
            {
              addedAt: expect.any(String),
              login: user.login,
              userId: user.id,
            },
          ],
        },
      },
    ]);
  });
});

describe("get blog by id /blogs/:id", () => {
  connectToTestDBAndClearRepositories();

  it("should return 404 for non existent blog", async () => {
    const res = await req.get(`${SETTINGS.PATH.BLOGS_PUBLIC}/7777`).expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Blog not found",
    });
  });

  it("should return blog", async () => {
    const createdBlog = (await createTestBlogs())[0];

    const res = await req
      .get(`${SETTINGS.PATH.BLOGS_PUBLIC}/${createdBlog.id}`)
      .expect(200);

    expect(res.body).toEqual(createdBlog);
  });
});
