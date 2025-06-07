import {
  connectToTestDBAndClearRepositories,
  req,
  testBasicAuthHeader,
} from "../helpers";
import { SETTINGS } from "../../settings";
import { createTestBlogs } from "./helpers";
import { createTestPosts } from "../posts/helpers";
import { convertObjectToQueryString } from "../../utils/convertObjectToQueryString";
import { SortDirection } from "../../core/dto/base.query-params.input-dto";
import { BlogViewDto } from "../../modules/bloggers-platform/blogs/api/view-dto/blogs.view-dto";
import { CreateBlogInputDto } from "../../modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto";
import { CreatePostInputDto } from "../../modules/bloggers-platform/posts/api/input-dto/posts.input-dto";
import { GetBlogsQueryParams } from "../../modules/bloggers-platform/blogs/api/input-dto/get-blogs-query-params.input-dto";
import { UserViewDto } from "../../modules/user-accounts/users/api/view-dto/users.view-dto";
import { PostViewDto } from "../../modules/bloggers-platform/posts/api/view-dto/posts.view-dto";
import { createTestUsers, getUsersJwtTokens } from "../users/helpers";
import { CreatePostByBlogIdInputDto } from "../../modules/bloggers-platform/blogs/api/input-dto/create-post-by-blog-id.input-dto";

describe("create blog /blogs", () => {
  connectToTestDBAndClearRepositories();

  it("should return 401 for unauthorized user", async () => {
    await req.post(SETTINGS.PATH.BLOGS).send({}).expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const newBlog: { name: null; description: null; websiteUrl: string } = {
      name: null,
      description: null,
      websiteUrl: "mytestsite.com",
    };

    const res = await req
      .post(SETTINGS.PATH.BLOGS)
      .set("Authorization", testBasicAuthHeader)
      .send(newBlog)
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(3);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "name",
        message:
          "name must be longer than or equal to 1 characters; Received value: null",
      },
      {
        field: "description",
        message:
          "description must be longer than or equal to 1 characters; Received value: null",
      },
      {
        field: "websiteUrl",
        message:
          "websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/ regular expression; Received value: mytestsite.com",
      },
    ]);
  });

  it("should create a blog", async () => {
    const newBlog: CreateBlogInputDto = {
      name: "test name",
      description: "test description",
      websiteUrl: "https://mytestsite.com",
    };

    const res = await req
      .post(SETTINGS.PATH.BLOGS)
      .set("Authorization", testBasicAuthHeader)
      .send(newBlog)
      .expect(201);

    expect(res.body).toEqual({
      ...newBlog,
      isMembership: false,
      id: expect.any(String),
      createdAt: expect.any(String),
    });
  });
});

describe("get all blogs /blogs", () => {
  connectToTestDBAndClearRepositories();

  let createdBlogs: BlogViewDto[] = [];

  it("should get empty array", async () => {
    const res = await req.get(SETTINGS.PATH.BLOGS).expect(200);

    expect(res.body.pagesCount).toBe(0);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(0);
    expect(res.body.items.length).toBe(0);
  });

  it("should get not empty array without query params", async () => {
    createdBlogs = await createTestBlogs(2);

    const res = await req.get(SETTINGS.PATH.BLOGS).expect(200);

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
      .get(`${SETTINGS.PATH.BLOGS}${queryString}`)
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
      .get(`${SETTINGS.PATH.BLOGS}${queryString}`)
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
      .get(`${SETTINGS.PATH.BLOGS}${queryString}`)
      .expect(200);

    expect(res.body.pagesCount).toBe(2);
    expect(res.body.page).toBe(2);
    expect(res.body.pageSize).toBe(1);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.items.length).toBe(1);

    expect(res.body.items[0]).toEqual(createdBlogs[0]);
  });
});

describe("get blog by id /blogs/:id", () => {
  connectToTestDBAndClearRepositories();

  it("should return 404 for non existent blog", async () => {
    const res = await req.get(`${SETTINGS.PATH.BLOGS}/7777`).expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Blog not found",
    });
  });

  it("should return blog", async () => {
    const createdBlog = (await createTestBlogs())[0];

    const res = await req
      .get(`${SETTINGS.PATH.BLOGS}/${createdBlog.id}`)
      .expect(200);

    expect(res.body).toEqual(createdBlog);
  });
});

describe("update blog by id /blogs/:id", () => {
  connectToTestDBAndClearRepositories();

  it("should return 401 for unauthorized user", async () => {
    await req.put(`${SETTINGS.PATH.BLOGS}/777777`).send({}).expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const updatedBlog: { name: null; description: null; websiteUrl: null } = {
      name: null,
      description: null,
      websiteUrl: null,
    };

    const res = await req
      .put(`${SETTINGS.PATH.BLOGS}/777777`)
      .set("Authorization", testBasicAuthHeader)
      .send(updatedBlog)
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(3);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "name",
        message:
          "name must be longer than or equal to 1 characters; Received value: null",
      },
      {
        field: "description",
        message:
          "description must be longer than or equal to 1 characters; Received value: null",
      },
      {
        field: "websiteUrl",
        message:
          "websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/ regular expression; Received value: null",
      },
    ]);
  });

  it("should return 404 for non existent blog", async () => {
    const updatedBlog: CreateBlogInputDto = {
      name: "test name 2",
      description: "test description 2",
      websiteUrl: "https://mytestsite2.com",
    };

    const res = await req
      .put(`${SETTINGS.PATH.BLOGS}/777777`)
      .set("Authorization", testBasicAuthHeader)
      .send(updatedBlog)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Blog not found",
    });
  });

  it("should update a blog", async () => {
    const createdBlog = (await createTestBlogs())[0];

    const updatedBlog: CreateBlogInputDto = {
      name: "test name 2",
      description: "test description 2",
      websiteUrl: "https://mytestsite2.com",
    };

    await req
      .put(`${SETTINGS.PATH.BLOGS}/${createdBlog?.id}`)
      .set("Authorization", testBasicAuthHeader)
      .send(updatedBlog)
      .expect(204);

    const checkRes = await req
      .get(`${SETTINGS.PATH.BLOGS}/${createdBlog?.id}`)
      .expect(200);

    expect(checkRes.body).toEqual({
      ...updatedBlog,
      isMembership: false,
      id: createdBlog.id,
      createdAt: createdBlog.createdAt,
    });
  });
});

describe("delete blog by id /blogs/:id", () => {
  connectToTestDBAndClearRepositories();

  it("should return 401 for unauthorized user", async () => {
    await req.delete(`${SETTINGS.PATH.BLOGS}/777777`).send({}).expect(401);
  });

  it("should return 404 for non existent blog", async () => {
    const res = await req
      .delete(`${SETTINGS.PATH.BLOGS}/77777`)
      .set("Authorization", testBasicAuthHeader)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Blog not found",
    });
  });

  it("should delete blog and get empty array", async () => {
    const createdBlog = (await createTestBlogs())[0];

    const checkResBefore = await req.get(SETTINGS.PATH.BLOGS).expect(200);

    expect(checkResBefore.body.pagesCount).toBe(1);
    expect(checkResBefore.body.page).toBe(1);
    expect(checkResBefore.body.pageSize).toBe(10);
    expect(checkResBefore.body.totalCount).toBe(1);
    expect(checkResBefore.body.items.length).toBe(1);

    await req
      .delete(`${SETTINGS.PATH.BLOGS}/${createdBlog?.id}`)
      .set("Authorization", testBasicAuthHeader)
      .expect(204);

    const checkResAfter = await req.get(SETTINGS.PATH.BLOGS).expect(200);

    expect(checkResAfter.body.pagesCount).toBe(0);
    expect(checkResAfter.body.page).toBe(1);
    expect(checkResAfter.body.pageSize).toBe(10);
    expect(checkResAfter.body.totalCount).toBe(0);
    expect(checkResAfter.body.items.length).toBe(0);
  });
});

describe("get posts by blogId /blogs/:id/posts", () => {
  connectToTestDBAndClearRepositories();

  let user: UserViewDto;
  let userToken: string;
  let createdPosts: PostViewDto[];

  beforeAll(async () => {
    const createdUsers = await createTestUsers({});
    user = createdUsers[0];

    const usersTokens = await getUsersJwtTokens(createdUsers);
    userToken = usersTokens[0];

    const createdBlog = (await createTestBlogs())[0];
    createdPosts = await createTestPosts({ blogId: createdBlog.id, count: 2 });

    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPosts[0].id}/like-status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ likeStatus: "Like" })
      .expect(204);
  });

  it("should return 404 for non existent blog", async () => {
    const res = await req
      .get(`${SETTINGS.PATH.BLOGS}/123777/posts`)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Blog not found",
    });
  });

  it("should get posts with 'None' like-status for all posts for unauthorized user", async () => {
    const res = await req
      .get(`${SETTINGS.PATH.BLOGS}/${createdPosts[0]?.blogId}/posts`)
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
      .get(`${SETTINGS.PATH.BLOGS}/${createdPosts[0]?.blogId}/posts`)
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

describe("create post by blogId /blogs/:id/posts", () => {
  connectToTestDBAndClearRepositories();

  it("should return 401 for unauthorized user", async () => {
    await req.post(`${SETTINGS.PATH.BLOGS}/123777/posts`).send({}).expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const newPost: Omit<CreatePostByBlogIdInputDto, "shortDescription"> = {
      title: "length_31-DrmM8lHeNjSykwSzQ7Her",
      content: "valid",
    };

    const res = await req
      .post(`${SETTINGS.PATH.BLOGS}/123777/posts`)
      .set("Authorization", testBasicAuthHeader)
      .send(newPost)
      .expect(400);

    expect(res.body.errorsMessages).toEqual([
      {
        field: "title",
        message:
          "title must be shorter than or equal to 30 characters; Received value: length_31-DrmM8lHeNjSykwSzQ7Her",
      },
      {
        field: "shortDescription",
        message:
          "shortDescription must be longer than or equal to 1 characters; Received value: undefined",
      },
    ]);
  });

  it("should return 404 for non existent blog", async () => {
    const newPost: CreatePostByBlogIdInputDto = {
      title: "title",
      content: "content",
      shortDescription: "shortDescription",
    };

    const res = await req
      .post(`${SETTINGS.PATH.BLOGS}/123777/posts`)
      .set("Authorization", testBasicAuthHeader)
      .send(newPost)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Blog not found",
    });
  });

  it("should create a post", async () => {
    const createdBlog = (await createTestBlogs())[0];

    const newPost: Omit<CreatePostInputDto, "blogId"> = {
      title: "title1",
      shortDescription: "shortDescription1",
      content: "content1",
    };

    const res = await req
      .post(`${SETTINGS.PATH.BLOGS}/${createdBlog?.id}/posts`)
      .set("Authorization", testBasicAuthHeader)
      .send(newPost)
      .expect(201);

    expect(res.body).toEqual({
      ...newPost,
      id: expect.any(String),
      blogId: createdBlog?.id,
      blogName: createdBlog?.name,
      createdAt: expect.any(String),
      extendedLikesInfo: {
        dislikesCount: 0,
        likesCount: 0,
        myStatus: "None",
        newestLikes: [],
      },
    });
  });
});
