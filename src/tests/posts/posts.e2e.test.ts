import { SETTINGS } from "../../settings";
import { createTestPostsByBlog } from "../blogs/helpers";
import { createTestComments } from "../comments/helpers";
import { connectToTestDBAndClearRepositories, req } from "../helpers";
import { createTestUsers, getUsersJwtTokens } from "../users/helpers";
import { UserViewDtoPg } from "../../modules/user-accounts/users/api/view-dto/users.view-dto.pg";
import { PostViewDtoPg } from "../../modules/bloggers-platform/posts/api/view-dto/posts.view-dto.pg";
import { CreateCommentByPostIdInputDto } from "../../modules/bloggers-platform/posts/api/input-dto/posts.input-dto";
import { CommentViewDtoPg } from "../../modules/bloggers-platform/comments/api/view-dto/comments.view-dto.pg";

describe("get all /posts", () => {
  connectToTestDBAndClearRepositories();

  let createdPost: PostViewDtoPg;

  it("should get empty array", async () => {
    const res = await req.get(SETTINGS.PATH.POSTS).expect(200);

    expect(res.body.items.length).toBe(0);
  });

  it("should get not empty array", async () => {
    createdPost = (await createTestPostsByBlog())[0];

    const res = await req.get(SETTINGS.PATH.POSTS).expect(200);

    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0]).toEqual(createdPost);
  });

  it("should return post with like-status", async () => {
    const user = (await createTestUsers({}))[0];
    const userToken = (await getUsersJwtTokens([user]))[0];

    await req
      .put(`${SETTINGS.PATH.POSTS}/${createdPost?.id}/like-status`)
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
            login: user?.login,
            userId: user?.id,
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
    const createdPost = (await createTestPostsByBlog())[0];

    const res = await req
      .get(`${SETTINGS.PATH.POSTS}/${createdPost?.id}`)
      .expect(200);

    expect(res.body).toEqual(createdPost);
  });
});

describe("create comment by post id /posts/:id/comments", () => {
  connectToTestDBAndClearRepositories();

  let createdPost: PostViewDtoPg;

  let createdUser: UserViewDtoPg;
  let userToken: string;

  beforeAll(async () => {
    createdPost = (await createTestPostsByBlog())[0];

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

  let createdComment: CommentViewDtoPg;
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

  let user1: UserViewDtoPg;
  let user2: UserViewDtoPg;
  let user3: UserViewDtoPg;
  let user4: UserViewDtoPg;

  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  let user4Token: string;

  let createdPost: PostViewDtoPg;

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

    createdPost = (await createTestPostsByBlog())[0];
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
