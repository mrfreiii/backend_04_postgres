import { req } from "../helpers";
import { SETTINGS } from "../../settings";
import { createTestPosts } from "../posts/helpers";
import { createTestBlogs } from "../blogs/helpers";
import { createTestUsers, getUsersJwtTokens } from "../users/helpers";
import { CommentViewDto } from "../../modules/bloggers-platform/comments/api/view-dto/comments.view-dto";
import { CreateCommentByPostIdInputDto } from "../../modules/bloggers-platform/posts/api/input-dto/posts.input-dto";
import { UserViewDto } from "../../modules/user-accounts/users/api/view-dto/users.view-dto";

export type TestCommentDataType = {
  comments: CommentViewDto[];
  createdPostId: string;
  createdUser: UserViewDto;
  userToken: string;
};

export const createTestComments = async (
  count: number = 1,
): Promise<TestCommentDataType> => {
  const commentsList: CommentViewDto[] = [];

  const createdBlog = (await createTestBlogs())[0];
  const createdPost = (await createTestPosts({ blogId: createdBlog.id }))[0];

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
