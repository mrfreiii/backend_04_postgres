import {
  req,
  testBasicAuthHeader,
  connectToTestDBAndClearRepositories,
} from "../helpers";
import { SETTINGS } from "../../settings";
import { createTestBlogs, createTestPostsByBlog } from "./helpers";
import { createTestUsers, getUsersJwtTokens } from "../users/helpers";
import { convertObjectToQueryString } from "../../utils/convertObjectToQueryString";

import { SortDirection } from "../../core/dto/base.query-params.input-dto";
import { BlogViewDtoPg } from "../../modules/bloggers-platform/blogs/api/view-dto/blogs.view-dto.pg";
import { PostViewDtoPg } from "../../modules/bloggers-platform/posts/api/view-dto/posts.view-dto.pg";
import { CreateBlogInputDto } from "../../modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto";
import { CreatePostInputDto } from "../../modules/bloggers-platform/posts/api/input-dto/posts.input-dto";
import { GetBlogsQueryParams } from "../../modules/bloggers-platform/blogs/api/input-dto/get-blogs-query-params.input-dto";
import { UpdatePostByBlogInputDto } from "../../modules/bloggers-platform/blogs/api/input-dto/update-post-by-blog.input-dto";
import { CreatePostByBlogIdInputDto } from "../../modules/bloggers-platform/blogs/api/input-dto/create-post-by-blog-id.input-dto";

describe("create blog /sa/blogs", () => {
  connectToTestDBAndClearRepositories();

  it("should return 401 for unauthorized user", async () => {
    await req.post(SETTINGS.PATH.BLOGS_ADMIN).send({}).expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const newBlog: { name: null; description: null; websiteUrl: string } = {
      name: null,
      description: null,
      websiteUrl: "mytestsite.com",
    };

    const res = await req
      .post(SETTINGS.PATH.BLOGS_ADMIN)
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
      .post(SETTINGS.PATH.BLOGS_ADMIN)
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

describe("get all blogs /sa/blogs", () => {
  connectToTestDBAndClearRepositories();

  let createdBlogs: BlogViewDtoPg[] = [];

  it("should return 401 for unauthorized user", async () => {
    await req.get(SETTINGS.PATH.BLOGS_ADMIN).expect(401);
  });

  it("should get empty array", async () => {
    const res = await req
      .get(SETTINGS.PATH.BLOGS_ADMIN)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(res.body.pagesCount).toBe(0);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(0);
    expect(res.body.items.length).toBe(0);
  });

  it("should get not empty array without query params", async () => {
    createdBlogs = await createTestBlogs(2);

    const res = await req
      .get(SETTINGS.PATH.BLOGS_ADMIN)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

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
      .get(`${SETTINGS.PATH.BLOGS_ADMIN}${queryString}`)
      .set("Authorization", testBasicAuthHeader)
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
      .get(`${SETTINGS.PATH.BLOGS_ADMIN}${queryString}`)
      .set("Authorization", testBasicAuthHeader)
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
      .get(`${SETTINGS.PATH.BLOGS_ADMIN}${queryString}`)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(res.body.pagesCount).toBe(2);
    expect(res.body.page).toBe(2);
    expect(res.body.pageSize).toBe(1);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.items.length).toBe(1);

    expect(res.body.items[0]).toEqual(createdBlogs[0]);
  });
});

describe("update blog by id /blogs/:id", () => {
  connectToTestDBAndClearRepositories();

  it("should return 401 for unauthorized user", async () => {
    await req.put(`${SETTINGS.PATH.BLOGS_ADMIN}/777777`).send({}).expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const updatedBlog: { name: null; description: null; websiteUrl: null } = {
      name: null,
      description: null,
      websiteUrl: null,
    };

    const res = await req
      .put(`${SETTINGS.PATH.BLOGS_ADMIN}/777777`)
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
      .put(`${SETTINGS.PATH.BLOGS_ADMIN}/777777`)
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
      .put(`${SETTINGS.PATH.BLOGS_ADMIN}/${createdBlog?.id}`)
      .set("Authorization", testBasicAuthHeader)
      .send(updatedBlog)
      .expect(204);

    const checkRes = await req
      .get(SETTINGS.PATH.BLOGS_ADMIN)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(checkRes.body.items[0]).toEqual({
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
    await req
      .delete(`${SETTINGS.PATH.BLOGS_ADMIN}/777777`)
      .send({})
      .expect(401);
  });

  it("should return 404 for non existent blog", async () => {
    const res = await req
      .delete(`${SETTINGS.PATH.BLOGS_ADMIN}/77777`)
      .set("Authorization", testBasicAuthHeader)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Blog not found",
    });
  });

  it("should delete blog and get empty array", async () => {
    const createdBlog = (await createTestBlogs())[0];

    const checkResBefore = await req
      .get(SETTINGS.PATH.BLOGS_ADMIN)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(checkResBefore.body.pagesCount).toBe(1);
    expect(checkResBefore.body.page).toBe(1);
    expect(checkResBefore.body.pageSize).toBe(10);
    expect(checkResBefore.body.totalCount).toBe(1);
    expect(checkResBefore.body.items.length).toBe(1);

    await req
      .delete(`${SETTINGS.PATH.BLOGS_ADMIN}/${createdBlog?.id}`)
      .set("Authorization", testBasicAuthHeader)
      .expect(204);

    const checkResAfter = await req
      .get(SETTINGS.PATH.BLOGS_ADMIN)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(checkResAfter.body.pagesCount).toBe(0);
    expect(checkResAfter.body.page).toBe(1);
    expect(checkResAfter.body.pageSize).toBe(10);
    expect(checkResAfter.body.totalCount).toBe(0);
    expect(checkResAfter.body.items.length).toBe(0);
  });
});

describe("create post by blogId /blogs/:id/posts", () => {
  connectToTestDBAndClearRepositories();

  it("should return 401 for unauthorized user", async () => {
    await req
      .post(`${SETTINGS.PATH.BLOGS_ADMIN}/123777/posts`)
      .send({})
      .expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const newPost: Omit<CreatePostByBlogIdInputDto, "shortDescription"> = {
      title: "length_31-DrmM8lHeNjSykwSzQ7Her",
      content: "valid",
    };

    const res = await req
      .post(`${SETTINGS.PATH.BLOGS_ADMIN}/123777/posts`)
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
      .post(`${SETTINGS.PATH.BLOGS_ADMIN}/123777/posts`)
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
      .post(`${SETTINGS.PATH.BLOGS_ADMIN}/${createdBlog?.id}/posts`)
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

describe("get posts by blogId /blogs/:id/posts", () => {
  connectToTestDBAndClearRepositories();

  let userToken: string;
  let createdPosts: PostViewDtoPg[];

  beforeAll(async () => {
    createdPosts = await createTestPostsByBlog(2);

    const createdUsers = await createTestUsers({});

    const usersTokens = await getUsersJwtTokens(createdUsers);
    userToken = usersTokens[0];

    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPosts[0].id}/like-status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ likeStatus: "Like" })
      .expect(204);
  });

  it("should return 401 for unauthorized user", async () => {
    await req
      .get(`${SETTINGS.PATH.BLOGS_ADMIN}/123777/posts`)
      .send({})
      .expect(401);
  });

  it("should return 404 for non existent blog", async () => {
    const res = await req
      .get(`${SETTINGS.PATH.BLOGS_ADMIN}/123777/posts`)
      .set("Authorization", testBasicAuthHeader)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Blog not found",
    });
  });

  it("should get posts with 'None' like-status for all posts for unauthorized user", async () => {
    const res = await req
      .get(`${SETTINGS.PATH.BLOGS_ADMIN}/${createdPosts[0].blogId}/posts`)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(res.body.pagesCount).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.items.length).toBe(2);

    expect(res.body.items).toEqual([createdPosts[1], createdPosts[0]]);
  });
});

describe("update post by blog id /blogs/:blogId/posts/:postId", () => {
  connectToTestDBAndClearRepositories();

  it("should return 401 for unauthorized user", async () => {
    await req
      .put(`${SETTINGS.PATH.BLOGS_ADMIN}/7777/posts/5555`)
      .send({})
      .expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const updatedPost: {
      title: null;
      shortDescription: null;
      content: null;
    } = {
      title: null,
      shortDescription: null,
      content: null,
    };

    const res = await req
      .put(`${SETTINGS.PATH.BLOGS_ADMIN}/77777/posts/5555`)
      .set("Authorization", testBasicAuthHeader)
      .send(updatedPost)
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(3);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "title",
        message:
          "title must be longer than or equal to 1 characters; Received value: null",
      },
      {
        field: "shortDescription",
        message:
          "shortDescription must be longer than or equal to 1 characters; Received value: null",
      },
      {
        field: "content",
        message:
          "content must be longer than or equal to 1 characters; Received value: null",
      },
    ]);
  });

  it("should return 404 for non existent blog", async () => {
    const updatedPost: UpdatePostByBlogInputDto = {
      title: "new title",
      shortDescription: "new description",
      content: "new content",
    };

    const res = await req
      .put(`${SETTINGS.PATH.BLOGS_ADMIN}/77777/posts/5555`)
      .set("Authorization", testBasicAuthHeader)
      .send(updatedPost)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Blog not found",
    });
  });

  it("should return 404 for non existent post", async () => {
    const createdBlog = (await createTestBlogs())[0];

    const updatedPost: UpdatePostByBlogInputDto = {
      title: "new title",
      shortDescription: "new description",
      content: "new content",
    };

    const res = await req
      .put(`${SETTINGS.PATH.BLOGS_ADMIN}/${createdBlog.id}/posts/5555`)
      .set("Authorization", testBasicAuthHeader)
      .send(updatedPost)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Post not found",
    });
  });

  it("should update a post", async () => {
    const createdPost = (await createTestPostsByBlog())[0];

    const updatedPost: UpdatePostByBlogInputDto = {
      title: "new new title",
      shortDescription: "new new description",
      content: "new new content",
    };

    await req
      .put(
        `${SETTINGS.PATH.BLOGS_ADMIN}/${createdPost.blogId}/posts/${createdPost?.id}`,
      )
      .set("Authorization", testBasicAuthHeader)
      .send(updatedPost)
      .expect(204);

    const res = await req
      .get(`${SETTINGS.PATH.BLOGS_ADMIN}/${createdPost.blogId}/posts`)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(res.body.items[0]).toEqual({
      ...updatedPost,
      id: createdPost.id,
      blogId: createdPost.blogId,
      blogName: createdPost.blogName,
      createdAt: createdPost.createdAt,
      extendedLikesInfo: {
        dislikesCount: 0,
        likesCount: 0,
        myStatus: "None",
        newestLikes: [],
      },
    });
  });
});

describe("delete post by blog id /blogs/:blogId/posts/:postId", () => {
  connectToTestDBAndClearRepositories();

  it("should return 401 for unauthorized user", async () => {
    await req
      .delete(`${SETTINGS.PATH.BLOGS_ADMIN}/7777/posts/5555`)
      .expect(401);
  });

  it("should return 404 for non existent blog", async () => {
    const res = await req
      .delete(`${SETTINGS.PATH.BLOGS_ADMIN}/77777/posts/5555`)
      .set("Authorization", testBasicAuthHeader)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Blog not found",
    });
  });

  it("should return 404 for non existent post", async () => {
    const createdBlog = (await createTestBlogs())[0];

    const res = await req
      .delete(`${SETTINGS.PATH.BLOGS_ADMIN}/${createdBlog.id}/posts/5555`)
      .set("Authorization", testBasicAuthHeader)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Post not found",
    });
  });

  it("should delete a post", async () => {
    const createdPost = (await createTestPostsByBlog())[0];

    const resBefore = await req
      .get(`${SETTINGS.PATH.BLOGS_ADMIN}/${createdPost.blogId}/posts`)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);
    expect(resBefore.body.items[0]).toEqual(createdPost);

    await req
      .delete(
        `${SETTINGS.PATH.BLOGS_ADMIN}/${createdPost.blogId}/posts/${createdPost?.id}`,
      )
      .set("Authorization", testBasicAuthHeader)
      .expect(204);

    const resAfter = await req
      .get(`${SETTINGS.PATH.BLOGS_ADMIN}/${createdPost.blogId}/posts`)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);
    expect(resAfter.body.items.length).toBe(0);
  });
});
