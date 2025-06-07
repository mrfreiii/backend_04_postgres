import {
  connectToTestDBAndClearRepositories,
  req,
  testBasicAuthHeader,
} from "../helpers";
import { SETTINGS } from "../../settings";
import { createTestUsers } from "../users/helpers";
import { createTestBlogs } from "../blogs/helpers";
import { createTestPosts } from "../posts/helpers";

describe("delete all data", () => {
  connectToTestDBAndClearRepositories();

  it("should get default users, post and blog", async () => {
    const user = (await createTestUsers({}))[0];

    const userRes = await req
      .get(SETTINGS.PATH.USERS)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(userRes.body.items).toEqual([user]);
    const createdBlog = (await createTestBlogs())[0];
    const createdPost = (await createTestPosts({ blogId: createdBlog.id }))[0];

    const blogsRes = await req.get(SETTINGS.PATH.BLOGS).expect(200);
    expect(blogsRes.body.items).toEqual([createdBlog]);

    const postsRes = await req.get(SETTINGS.PATH.POSTS).expect(200);
    expect(postsRes.body.items[0]).toEqual({
      ...createdPost,
      blogName: createdBlog.name,
    });
  });

  it("should delete all data", async () => {
    await req.delete(`${SETTINGS.PATH.TESTING}/all-data`).expect(204);

    const userRes = await req
      .get(SETTINGS.PATH.USERS)
      .set("Authorization", testBasicAuthHeader)
      .expect(200);

    expect(userRes.body.items.length).toBe(0);
    const blogsRes = await req.get(SETTINGS.PATH.BLOGS).expect(200);
    expect(blogsRes.body.items.length).toBe(0);

    const postsRes = await req.get(SETTINGS.PATH.POSTS).expect(200);
    expect(postsRes.body.items.length).toBe(0);
  });
});

describe("delete rate limits", () => {
  connectToTestDBAndClearRepositories();

  it("should delete rate limits", async () => {
    await req.delete(`${SETTINGS.PATH.TESTING}/rate-limits`).expect(204);
  });
});
