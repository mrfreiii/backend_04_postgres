import {
  connectToTestDBAndClearRepositories,
  req,
  testBasicAuthHeader,
} from "../helpers";
import { SETTINGS } from "../../settings";
import { createTestPosts } from "./helpers";
import { createTestBlogs } from "../blogs/helpers";
import { createTestComments } from "../comments/helpers";
import { createTestUsers, getUsersJwtTokens } from "../users/helpers";
import {
  CreateCommentByPostIdInputDto,
  CreatePostInputDto,
} from "../../modules/bloggers-platform/posts/api/input-dto/posts.input-dto";
import { UserViewDto } from "../../modules/user-accounts/users/api/view-dto/users.view-dto";
import { PostViewDto } from "../../modules/bloggers-platform/posts/api/view-dto/posts.view-dto";
import { UpdatePostInputDto } from "../../modules/bloggers-platform/posts/api/input-dto/update-post.input-dto";
import { CommentViewDto } from "../../modules/bloggers-platform/comments/api/view-dto/comments.view-dto";

describe("create post /posts", () => {
  connectToTestDBAndClearRepositories();

  it("should return 401 for unauthorized user", async () => {
    await req.post(SETTINGS.PATH.POSTS).send({}).expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const newPost: {
      title: null;
      shortDescription: null;
      content: null;
      blogId: null;
    } = {
      title: null,
      shortDescription: null,
      content: null,
      blogId: null,
    };

    const res = await req
      .post(SETTINGS.PATH.POSTS)
      .set("Authorization", testBasicAuthHeader)
      .send(newPost)
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(4);
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
      {
        field: "blogId",
        message: "blogId must be a string; Received value: null",
      },
    ]);
  });

  it("should return 404 for non existent blog", async () => {
    const newPost: CreatePostInputDto = {
      title: "title",
      shortDescription: "shortDescription",
      content: "content",
      blogId: "123",
    };

    const res = await req
      .post(SETTINGS.PATH.POSTS)
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

    const newPost: CreatePostInputDto = {
      title: "title1",
      shortDescription: "shortDescription1",
      content: "content1",
      blogId: createdBlog.id,
    };

    const postRes = await req
      .post(SETTINGS.PATH.POSTS)
      .set("Authorization", testBasicAuthHeader)
      .send(newPost)
      .expect(201);

    expect(postRes.body).toEqual({
      ...newPost,
      id: expect.any(String),
      blogName: createdBlog.name,
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

describe("get all /posts", () => {
  connectToTestDBAndClearRepositories();

  let createdPost: PostViewDto;

  it("should get empty array", async () => {
    const res = await req.get(SETTINGS.PATH.POSTS).expect(200);

    expect(res.body.items.length).toBe(0);
  });

  it("should get not empty array", async () => {
    const createdBlog = (await createTestBlogs())[0];
    createdPost = (await createTestPosts({ blogId: createdBlog.id }))[0];

    const res = await req.get(SETTINGS.PATH.POSTS).expect(200);

    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0]).toEqual({
      ...createdPost,
      blogName: createdBlog.name,
    });
  });

  it("should return post with like-status", async () => {
    const user = (await createTestUsers({}))[0];
    const userToken = (await getUsersJwtTokens([user]))[0];

    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPost.id}/like-status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ likeStatus: "Like" })
      .expect(204);

    const res = await req
      .get(SETTINGS.PATH.POSTS)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0]).toEqual({
      ...createdPost,
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
    });
  });
});

describe("get post by id /posts/:id", () => {
  connectToTestDBAndClearRepositories();

  it("should return 404 for non existent post", async () => {
    const res = await req.get(`${SETTINGS.PATH.POSTS}/77777`).expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Post not found",
    });
  });

  it("should get not empty array", async () => {
    const createdBlog = (await createTestBlogs())[0];
    const createdPost = (await createTestPosts({ blogId: createdBlog.id }))[0];

    const res = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost?.id}`)
      .expect(200);

    expect(res.body).toEqual({
      ...createdPost,
      blogName: createdBlog.name,
    });
  });
});

describe("update post by id /posts/:id", () => {
  connectToTestDBAndClearRepositories();

  it("should return 401 for unauthorized user", async () => {
    await req.put(`${SETTINGS.PATH.POSTS}/7777`).send({}).expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const updatedPost: {
      title: null;
      shortDescription: null;
      content: null;
      blogId: null;
    } = {
      title: null,
      shortDescription: null,
      content: null,
      blogId: null,
    };

    const res = await req
      .put(`${SETTINGS.PATH.POSTS}/77777`)
      .set("Authorization", testBasicAuthHeader)
      .send(updatedPost)
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(4);
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
      {
        field: "blogId",
        message: "blogId must be a string; Received value: null",
      },
    ]);
  });

  it("should return 404 for non existent blog", async () => {
    const updatedPost: UpdatePostInputDto = {
      title: "new title",
      shortDescription: "new description",
      content: "new content",
      blogId: "123",
    };

    const res = await req
      .put(`${SETTINGS.PATH.POSTS}/77777`)
      .set("Authorization", testBasicAuthHeader)
      .send(updatedPost)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Blog not found",
    });
  });

  it("should return 404 for non existent post", async () => {
    const createdBlogs = await createTestBlogs(1);

    const updatedPost: UpdatePostInputDto = {
      title: "new title",
      shortDescription: "new description",
      content: "new content",
      blogId: createdBlogs[0].id,
    };

    const res = await req
      .put(`${SETTINGS.PATH.POSTS}/77777`)
      .set("Authorization", testBasicAuthHeader)
      .send(updatedPost)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Post not found",
    });
  });

  it("should update a post", async () => {
    const createdBlogs = await createTestBlogs(2);
    const createdPost = (
      await createTestPosts({ blogId: createdBlogs[0].id })
    )[0];

    const updatedPost: UpdatePostInputDto = {
      title: "new title",
      shortDescription: "new description",
      content: "new content",
      blogId: createdBlogs[1]?.id,
    };

    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPost?.id}`)
      .set("Authorization", testBasicAuthHeader)
      .send(updatedPost)
      .expect(204);

    const res = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost?.id}`)
      .expect(200);

    expect(res.body).toEqual({
      ...updatedPost,
      id: createdPost?.id,
      blogName: createdBlogs[1].name,
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

describe("delete post by id /posts/:id", () => {
  connectToTestDBAndClearRepositories();

  let postForDeletion: PostViewDto;

  it("should return 401 for unauthorized user", async () => {
    await req.delete(`${SETTINGS.PATH.POSTS}/7777`).expect(401);
  });

  it("should return 404 for non existent post", async () => {
    const res = await req
      .delete(`${SETTINGS.PATH.POSTS}/7777`)
      .set("Authorization", testBasicAuthHeader)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Post not found",
    });
  });

  it("should return not empty array", async () => {
    const createdBlog = (await createTestBlogs())[0];
    postForDeletion = (await createTestPosts({ blogId: createdBlog.id }))[0];

    const checkRes = await req.get(SETTINGS.PATH.POSTS).expect(200);

    expect(checkRes.body.items.length).toBe(1);
    expect(checkRes.body.items[0]).toEqual(postForDeletion);
  });

  it("should return empty array", async () => {
    await req
      .delete(`${SETTINGS.PATH.POSTS}/${postForDeletion?.id}`)
      .set("Authorization", testBasicAuthHeader)
      .expect(204);

    const checkRes = await req.get(SETTINGS.PATH.POSTS).expect(200);

    expect(checkRes.body.items.length).toBe(0);
  });
});

describe("create comment by post id /posts/:id/comments", () => {
  connectToTestDBAndClearRepositories();

  let createdPost: PostViewDto;

  let createdUser: UserViewDto;
  let userToken: string;

  beforeAll(async () => {
    const createdBlog = (await createTestBlogs())[0];
    createdPost = (await createTestPosts({ blogId: createdBlog.id }))[0];

    createdUser = (await createTestUsers({}))[0];
    userToken = (await getUsersJwtTokens([createdUser]))[0];
  });

  it("should return 401 for unauthorized user", async () => {
    await req
      .post(`${SETTINGS.PATH.POSTS}/777777/comments`)
      .send({})
      .expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const newComment: CreateCommentByPostIdInputDto = {
      content: "test content",
    };

    const res = await req
      .post(`${SETTINGS.PATH.POSTS}/777777/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send(newComment)
      .expect(400);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "content",
      message:
        "content must be longer than or equal to 20 characters; Received value: test content",
    });
  });

  it("should return 404 for non existent post", async () => {
    const newComment: CreateCommentByPostIdInputDto = {
      content: "123456789012345678901 test content",
    };

    const res = await req
      .post(`${SETTINGS.PATH.POSTS}/777777/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send(newComment)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Post not found",
    });
  });

  it("should create a comment", async () => {
    const newComment: CreateCommentByPostIdInputDto = {
      content: "123456789012345678901 test content",
    };

    const res = await req
      .post(`${SETTINGS.PATH.POSTS}/${createdPost.id}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send(newComment)
      .expect(201);

    expect(res.body).toEqual({
      ...newComment,
      commentatorInfo: {
        userId: createdUser.id,
        userLogin: createdUser.login,
      },
      id: expect.any(String),
      createdAt: expect.any(String),
      likesInfo: {
        dislikesCount: 0,
        likesCount: 0,
        myStatus: "None",
      },
    });
  });
});

describe("get comments by postId /posts", () => {
  connectToTestDBAndClearRepositories();

  let createdComment: CommentViewDto;
  let createdPostId: string;
  let userToken: string;

  beforeAll(async () => {
    const createdCommentsData = await createTestComments();

    createdComment = createdCommentsData.comments[0];
    createdPostId = createdCommentsData.createdPostId;
    userToken = createdCommentsData.userToken;
  });

  it("should return 404 for non existent post", async () => {
    const res = await req
      .get(`${SETTINGS.PATH.POSTS}/777777/comments`)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Post not found",
    });
  });

  it("should get not empty array", async () => {
    const res = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPostId}/comments`)
      .expect(200);

    expect(res.body.pagesCount).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(1);
    expect(res.body.items.length).toBe(1);

    expect(res.body.items[0]).toEqual(createdComment);
  });

  it("should return comment with correct like-status", async () => {
    await req
      .put(`${SETTINGS.PATH.COMMENTS}/${createdComment.id}/like-status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ likeStatus: "Like" })
      .expect(204);

    const res = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPostId}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.pagesCount).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalCount).toBe(1);
    expect(res.body.items.length).toBe(1);

    expect(res.body.items[0]).toEqual({
      ...createdComment,
      likesInfo: {
        dislikesCount: 0,
        likesCount: 1,
        myStatus: "Like",
      },
    });
  });
});

describe("update post likes /posts/:postId/like-status", () => {
  connectToTestDBAndClearRepositories();

  let user1: UserViewDto;
  let user2: UserViewDto;
  let user3: UserViewDto;
  let user4: UserViewDto;

  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  let user4Token: string;

  let createdPost: PostViewDto;

  beforeAll(async () => {
    const createdUsers = await createTestUsers({ count: 4 });
    user1 = createdUsers[0];
    user2 = createdUsers[1];
    user3 = createdUsers[2];
    user4 = createdUsers[3];

    const usersTokens = await getUsersJwtTokens(createdUsers);
    user1Token = usersTokens[0];
    user2Token = usersTokens[1];
    user3Token = usersTokens[2];
    user4Token = usersTokens[3];

    const createdBlog = (await createTestBlogs())[0];
    createdPost = (await createTestPosts({ blogId: createdBlog.id }))[0];
  });

  it("should return 401 for request without auth header", async () => {
    await req
      .put(`${SETTINGS.PATH.POSTS}/7777/like-status`)
      .send({})
      .expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const res = await req
      .put(`${SETTINGS.PATH.POSTS}/7777/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ likeStatus: "some" })
      .expect(400);

    expect(res.body.errorsMessages.length).toBe(1);
    expect(res.body.errorsMessages).toEqual([
      {
        field: "likeStatus",
        message:
          "likeStatus must be one of the following values: None, Like, Dislike; Received value: some",
      },
    ]);
  });

  it("should return 404 for non existent post", async () => {
    await req
      .put(`${SETTINGS.PATH.POSTS}/7777/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ likeStatus: "None" })
      .expect(404);
  });

  it("should increase Likes count", async () => {
    //Checking initial status
    const res0 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res0.body.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: "None",
      newestLikes: [],
    });

    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPost.id}/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ likeStatus: "Like" })
      .expect(204);

    // Checking status for non-authenticated user
    const res1 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res1.body.extendedLikesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: "None",
      newestLikes: [
        {
          addedAt: expect.any(String),
          userId: user1.id,
          login: user1.login,
        },
      ],
    });

    // Checking status for authenticated user
    const res2 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(200);
    expect(res2.body.extendedLikesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: "Like",
      newestLikes: [
        {
          addedAt: expect.any(String),
          userId: user1.id,
          login: user1.login,
        },
      ],
    });
  });

  it("should keep Likes count", async () => {
    //Checking initial status
    const res0 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res0.body.extendedLikesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: "None",
      newestLikes: [
        {
          addedAt: expect.any(String),
          userId: user1.id,
          login: user1.login,
        },
      ],
    });

    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPost.id}/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ likeStatus: "Like" })
      .expect(204);

    const res1 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res1.body.extendedLikesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: "None",
      newestLikes: [
        {
          addedAt: expect.any(String),
          userId: user1.id,
          login: user1.login,
        },
      ],
    });
  });

  it("should reduce Likes count, removed newestLikes, and increase Dislikes count", async () => {
    //Checking initial status
    const res0 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res0.body.extendedLikesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: "None",
      newestLikes: [
        {
          addedAt: expect.any(String),
          userId: user1.id,
          login: user1.login,
        },
      ],
    });

    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPost.id}/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ likeStatus: "Dislike" })
      .expect(204);

    // Checking status for non-authenticated user
    const res1 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res1.body.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: "None",
      newestLikes: [],
    });

    // Checking status for authenticated user
    const res2 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(200);
    expect(res2.body.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: "Dislike",
      newestLikes: [],
    });
  });

  it("should reduce Dislikes count and set None status", async () => {
    //Checking initial status
    const res0 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res0.body.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: "None",
      newestLikes: [],
    });

    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPost.id}/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ likeStatus: "None" })
      .expect(204);

    // Checking status for non-authenticated user
    const res1 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res1.body.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: "None",
      newestLikes: [],
    });

    // Checking status for authenticated user
    const res2 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(200);
    expect(res2.body.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: "None",
      newestLikes: [],
    });
  });

  it("should get last 3 likes", async () => {
    //Checking initial status
    const res0 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res0.body.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: "None",
      newestLikes: [],
    });

    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPost.id}/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ likeStatus: "Like" })
      .expect(204);
    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPost.id}/like-status`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ likeStatus: "Like" })
      .expect(204);
    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPost.id}/like-status`)
      .set("Authorization", `Bearer ${user3Token}`)
      .send({ likeStatus: "Like" })
      .expect(204);
    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPost.id}/like-status`)
      .set("Authorization", `Bearer ${user4Token}`)
      .send({ likeStatus: "Like" })
      .expect(204);

    // Checking status for non-authenticated user
    const res1 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res1.body.extendedLikesInfo).toEqual({
      likesCount: 4,
      dislikesCount: 0,
      myStatus: "None",
      newestLikes: [
        {
          addedAt: expect.any(String),
          userId: user4.id,
          login: user4.login,
        },
        {
          addedAt: expect.any(String),
          userId: user3.id,
          login: user3.login,
        },
        {
          addedAt: expect.any(String),
          userId: user2.id,
          login: user2.login,
        },
      ],
    });

    // Checking status for authenticated user
    const res2 = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost.id}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(200);
    expect(res2.body.extendedLikesInfo).toEqual({
      likesCount: 4,
      dislikesCount: 0,
      myStatus: "Like",
      newestLikes: [
        {
          addedAt: expect.any(String),
          userId: user4.id,
          login: user4.login,
        },
        {
          addedAt: expect.any(String),
          userId: user3.id,
          login: user3.login,
        },
        {
          addedAt: expect.any(String),
          userId: user2.id,
          login: user2.login,
        },
      ],
    });
  });
});
