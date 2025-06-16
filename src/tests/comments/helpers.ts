import { req } from "../helpers";
import { SETTINGS } from "../../settings";
import { createTestPostsByBlog } from "../blogs/helpers";
import { createTestUsers, getUsersJwtTokens } from "../users/helpers";
import { UserViewDtoPg } from "../../modules/user-accounts/users/api/view-dto/users.view-dto.pg";
import { CreateCommentByPostIdInputDto } from "../../modules/bloggers-platform/posts/api/input-dto/posts.input-dto";
import { CommentViewDtoPg } from "../../modules/bloggers-platform/comments/api/view-dto/comments.view-dto.pg";

export type TestCommentDataType = {
  comments: CommentViewDtoPg[];
  createdPostId: string;
  createdUser: UserViewDtoPg;
  userToken: string;
};

export const createTestComments = async (
  count: number = 1,
): Promise<TestCommentDataType> => {
  const commentsList: CommentViewDtoPg[] = [];

  const createdPost = (await createTestPostsByBlog())[0];

  const createdUser = (await createTestUsers({}))[0];
  const userToken = (await getUsersJwtTokens([createdUser]))[0];

  for (let i = 0; i < count; i++) {
    const comment: CreateCommentByPostIdInputDto = {
      content: `comment content is ${i + 1}`,
    };

    const res = await req
      .post(`${SETTINGS.PATH.POSTS}/${createdPost.id}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send(comment)
      .expect(201);

    commentsList.push(res.body);
  }

  return {
    comments: commentsList,
    createdPostId: createdPost.id,
    createdUser,
    userToken,
  };
};
