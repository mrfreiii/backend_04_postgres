export const SETTINGS = {
  PATH: {
    AUTH: "/auth",
    USERS_ADMIN: "/sa/users",
    BLOGS_PUBLIC: "/blogs",
    BLOGS_ADMIN: "/sa/blogs",
    POSTS: "/posts",
    COMMENTS: "/comments",
    TESTING: "/testing",
    SESSIONS: "/security/devices",
  },
  TABLES: {
    USERS: 'public."Users"',
    USERS_REGISTRATION_INFO: 'public."UsersRegistrationInfo"',
    USERS_PASSWORD_RECOVERY_INFO: 'public."UsersPasswordRecoveryInfo"',

    POSTS: 'public."Posts"',
    POSTS_LIKES: 'public."PostsLikes"',

    COMMENTS: 'public."Comments"',
    COMMENTS_LIKES: 'public."CommentsLikes"',

    LIKES_STATUSES: 'public."LikeStatuses"',
    BLOGS: 'public."Blogs"',
    SESSIONS: 'public."Sessions"',
    RATE_LIMIT: 'public."RateLimits"',
  },
};
