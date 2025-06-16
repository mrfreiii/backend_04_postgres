import { SETTINGS } from "../../settings";
import { createTestComments, TestCommentDataType } from "./helpers";
import { connectToTestDBAndClearRepositories, req } from "../helpers";
import { createTestUsers, getUsersJwtTokens } from "../users/helpers";
import { LikeStatusEnum } from "../../modules/bloggers-platform/likes/enums/likes.enum";
import { CommentViewDto } from "../../modules/bloggers-platform/comments/api/view-dto/comments.view-dto";
import { CreateCommentByPostIdInputDto } from "../../modules/bloggers-platform/posts/api/input-dto/posts.input-dto";
import { UpdateLikeStatusInputDto } from "../../modules/bloggers-platform/comments/api/input-dto/update-like-status.input-dto";

describe("get comment by id /comments/:id", () => {
  connectToTestDBAndClearRepositories();

  let createdComment: CommentViewDto;
  let userToken: string;

  beforeAll(async () => {
    const createdCommentData = await createTestComments();

    createdComment = createdCommentData.comments[0];
    userToken = createdCommentData.userToken;
  });

  it("should return 404 for non existent comment", async () => {
    await req.get(`${SETTINGS.PATH.COMMENTS}/777777`).expect(404);
  });

  it("should get comment", async () => {
    const res = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${createdComment.id}`)
      .expect(200);

    expect(res.body).toEqual(createdComment);
  });

  it("should get comment with correct like-status", async () => {
    await req
      .put(`${SETTINGS.PATH.COMMENTS}/${createdComment.id}/like-status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ likeStatus: "Like" })
      .expect(204);

    const res = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${createdComment.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toEqual({
      ...createdComment,
      likesInfo: {
        dislikesCount: 0,
        likesCount: 1,
        myStatus: "Like",
      },
    });
  });
});

describe("update comment by id /comments/:id", () => {
  connectToTestDBAndClearRepositories();

  let commentData: TestCommentDataType;
  let user2Token: string;

  beforeAll(async () => {
    commentData = await createTestComments();

    const user2 = (await createTestUsers({}))[0];
    user2Token = (await getUsersJwtTokens([user2]))[0];
  });

  it("should return 401 for unauthorized user", async () => {
    await req.put(`${SETTINGS.PATH.COMMENTS}/777777`).expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const newComment: CreateCommentByPostIdInputDto = {
      content: "test content",
    };

    const res = await req
      .put(`${SETTINGS.PATH.COMMENTS}/777777`)
      .set("Authorization", `Bearer ${commentData.userToken}`)
      .send(newComment)
      .expect(400);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "content",
      message:
        "content must be longer than or equal to 20 characters; Received value: test content",
    });
  });

  it("should return 404 for non existent comment", async () => {
    const newComment: CreateCommentByPostIdInputDto = {
      content: "12345678901234567890 test content",
    };

    const res = await req
      .put(`${SETTINGS.PATH.COMMENTS}/777777`)
      .set("Authorization", `Bearer ${commentData.userToken}`)
      .send(newComment)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Comment not found",
    });
  });

  it("should return 403 for editing comment of another user", async () => {
    const newComment: CreateCommentByPostIdInputDto = {
      content: "12345678901234567890 test content",
    };

    const res = await req
      .put(`${SETTINGS.PATH.COMMENTS}/${commentData.comments[0].id}`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send(newComment)
      .expect(403);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Forbidden to edit another user's comment",
    });
  });

  it("should update comment", async () => {
    const newComment: CreateCommentByPostIdInputDto = {
      content: "12345678901234567890 updated value",
    };

    await req
      .put(`${SETTINGS.PATH.COMMENTS}/${commentData.comments[0].id}`)
      .set("Authorization", `Bearer ${commentData.userToken}`)
      .send(newComment)
      .expect(204);

    const checkRes = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${commentData.comments[0].id}`)
      .expect(200);

    expect(checkRes.body).toEqual({
      ...commentData.comments[0],
      content: newComment.content,
    });
  });
});

describe("delete comment by id /comments/:id", () => {
  connectToTestDBAndClearRepositories();

  let commentData: TestCommentDataType;
  let user2Token: string;

  beforeAll(async () => {
    commentData = await createTestComments();

    const user2 = (await createTestUsers({}))[0];
    user2Token = (await getUsersJwtTokens([user2]))[0];
  });

  it("should return 401 for unauthorized user", async () => {
    await req.delete(`${SETTINGS.PATH.COMMENTS}/777777`).expect(401);
  });

  it("should return 404 for non existent comment", async () => {
    const res = await req
      .delete(`${SETTINGS.PATH.COMMENTS}/777777`)
      .set("Authorization", `Bearer ${commentData.userToken}`)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Comment not found",
    });
  });

  it("should return 403 for comment deletion of another user", async () => {
    const res = await req
      .delete(`${SETTINGS.PATH.COMMENTS}/${commentData.comments[0].id}`)
      .set("Authorization", `Bearer ${user2Token}`)
      .expect(403);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Forbidden to delete another user's comment",
    });
  });

  it("should delete comment", async () => {
    await req
      .delete(`${SETTINGS.PATH.COMMENTS}/${commentData.comments[0].id}`)
      .set("Authorization", `Bearer ${commentData.userToken}`)
      .expect(204);

    const checkRes = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${commentData.comments[0].id}`)
      .expect(404);

    expect(checkRes.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Comment not found",
    });
  });
});

describe("update comment likes /comments/:id/like-status", () => {
  connectToTestDBAndClearRepositories();

  let comment: CommentViewDto;
  let user1Token: string;

  beforeAll(async () => {
    comment = (await createTestComments()).comments[0];

    const user1 = (await createTestUsers({}))[0];
    user1Token = (await getUsersJwtTokens([user1]))[0];
  });

  it("should return 401 for unauthorized user", async () => {
    await req.put(`${SETTINGS.PATH.COMMENTS}/777777/like-status`).expect(401);
  });

  it("should return 400 for invalid values", async () => {
    const newStatus: { likeStatus: string } = {
      likeStatus: "test",
    };

    const res = await req
      .put(`${SETTINGS.PATH.COMMENTS}/777777/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send(newStatus)
      .expect(400);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "likeStatus",
      message:
        "likeStatus must be one of the following values: None, Like, Dislike; Received value: test",
    });
  });

  it("should return 404 for non existent comment", async () => {
    const newStatus: UpdateLikeStatusInputDto = {
      likeStatus: LikeStatusEnum.Like,
    };

    const res = await req
      .put(`${SETTINGS.PATH.COMMENTS}/777777/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send(newStatus)
      .expect(404);

    expect(res.body.errorsMessages[0]).toEqual({
      field: "",
      message: "Comment not found",
    });
  });

  it("should increase Likes count", async () => {
    //Checking initial status
    const res0 = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${comment.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res0.body.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: "None",
    });

    await req
      .put(`${SETTINGS.PATH.COMMENTS}/${comment.id}/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ likeStatus: "Like" })
      .expect(204);

    // // Checking status for non-authenticated user
    const res1 = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${comment.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res1.body.likesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: "None",
    });

    // Checking status for authenticated user
    const res2 = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${comment.id}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(200);
    expect(res2.body.likesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: "Like",
    });
  });

  it("should keep Likes count", async () => {
    //Checking initial status
    const res0 = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${comment.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res0.body.likesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: "None",
    });

    await req
      .put(`${SETTINGS.PATH.COMMENTS}/${comment.id}/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ likeStatus: "Like" })
      .expect(204);

    // Checking status for non-authenticated user
    const res1 = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${comment.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res1.body.likesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: "None",
    });
  });

  it("should reduce Likes count, and increase Dislikes count", async () => {
    //Checking initial status
    const res0 = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${comment.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res0.body.likesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: "None",
    });

    await req
      .put(`${SETTINGS.PATH.COMMENTS}/${comment.id}/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ likeStatus: "Dislike" })
      .expect(204);

    // Checking status for non-authenticated user
    const res1 = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${comment.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res1.body.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: "None",
    });

    // Checking status for authenticated user
    const res2 = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${comment.id}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(200);
    expect(res2.body.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: "Dislike",
    });
  });

  it("should reduce Dislikes count and set None status", async () => {
    //Checking initial status
    const res0 = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${comment.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res0.body.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: "None",
    });

    await req
      .put(`${SETTINGS.PATH.COMMENTS}/${comment.id}/like-status`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ likeStatus: "None" })
      .expect(204);

    // Checking status for non-authenticated user
    const res1 = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${comment.id}`)
      .set("Authorization", "")
      .expect(200);
    expect(res1.body.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: "None",
    });

    // Checking status for authenticated user
    const res2 = await req
      .get(`${SETTINGS.PATH.COMMENTS}/${comment.id}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .expect(200);
    expect(res2.body.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: "None",
    });
  });
});
