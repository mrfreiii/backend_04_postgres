import { SETTINGS } from "../../settings";
import { req, testBasicAuthHeader } from "../helpers";
import { CreatePostInputDto } from "../../modules/bloggers-platform/posts/api/input-dto/posts.input-dto";
import { PostViewDtoPg } from "../../modules/bloggers-platform/posts/api/view-dto/posts.view-dto.pg";

export const createTestPosts = async ({
  blogId,
  count = 1,
}: {
  blogId: string;
  count?: number;
}): Promise<PostViewDtoPg[]> => {
  const result: PostViewDtoPg[] = [];

  for (let i = 0; i < count; i++) {
    const post: CreatePostInputDto = {
      title: `title ${i + 1}`,
      shortDescription: `description ${i + 1}`,
      content: `content ${i + 1}`,
      blogId,
    };

    const res = await req
      .post(SETTINGS.PATH.POSTS)
      .set("Authorization", testBasicAuthHeader)
      .send(post)
      .expect(201);
    result.push(res.body);
  }

  return result;
};
