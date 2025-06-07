import { req, testBasicAuthHeader } from "../helpers";
import { SETTINGS } from "../../settings";
import { BlogViewDto } from "../../modules/bloggers-platform/blogs/api/view-dto/blogs.view-dto";
import { CreateBlogInputDto } from "../../modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto";

export const createTestBlogs = async (
  count: number = 1,
): Promise<BlogViewDto[]> => {
  const result: BlogViewDto[] = [];

  for (let i = 0; i < count; i++) {
    const blog: CreateBlogInputDto = {
      name: `${i % 2 ? "blog" : "BLOG"} name ${i + 1}`,
      description: `description ${i + 1}`,
      websiteUrl: `https://mynewblog${i + 1}.con`,
    };

    const res = await req
      .post(SETTINGS.PATH.BLOGS)
      .set("Authorization", testBasicAuthHeader)
      .send(blog)
      .expect(201);
    result.push(res.body);
  }

  return result;
};
