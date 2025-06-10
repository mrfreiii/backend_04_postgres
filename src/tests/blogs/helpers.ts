import { SETTINGS } from "../../settings";
import { req, testBasicAuthHeader } from "../helpers";
import { BlogViewDtoPg } from "../../modules/bloggers-platform/blogs/api/view-dto/blogs.view-dto.pg";
import { PostViewDtoPg } from "../../modules/bloggers-platform/posts/api/view-dto/posts.view-dto.pg";
import { CreateBlogInputDto } from "../../modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto";
import { CreatePostInputDto } from "../../modules/bloggers-platform/posts/api/input-dto/posts.input-dto";

export const createTestBlogs = async (
  count: number = 1,
): Promise<BlogViewDtoPg[]> => {
  const result: BlogViewDtoPg[] = [];

  for (let i = 0; i < count; i++) {
    const uniqueId = Number(Date.now()).toString().substring(4);

    const blog: CreateBlogInputDto = {
      name: `${i % 2 ? "blog" : "BLOG"} ${uniqueId}`,
      description: `description ${i + 1}${uniqueId}`,
      websiteUrl: `https://mynewblog${i + 1}${uniqueId}.con`,
    };

    const res = await req
      .post(SETTINGS.PATH.BLOGS_ADMIN)
      .set("Authorization", testBasicAuthHeader)
      .send(blog)
      .expect(201);
    result.push(res.body);
  }

  return result;
};

export const createTestPostsByBlog = async (
  count: number = 1,
): Promise<PostViewDtoPg[]> => {
  const result: PostViewDtoPg[] = [];

  const blog = (await createTestBlogs())[0];

  for (let i = 0; i < count; i++) {
    const uniqueId = Number(Date.now()).toString().substring(4);

    const post: Omit<CreatePostInputDto, "blogId"> = {
      title: `title ${i + 1}${uniqueId}`,
      shortDescription: `shortDescription ${i + 1}${uniqueId}`,
      content: `content ${i + 1}${uniqueId}`,
    };

    const res = await req
      .post(`${SETTINGS.PATH.BLOGS_ADMIN}/${blog.id}/posts`)
      .set("Authorization", testBasicAuthHeader)
      .send(post)
      .expect(201);

    result.push(res.body);
  }

  return result;
};
