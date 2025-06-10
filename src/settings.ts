export const SETTINGS = {
  PATH: {
    AUTH: "/auth",
    USERS_ADMIN: "/sa/users",
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
    BLOGS: 'public."Blogs"',
    POSTS: 'public."Posts"',
    SESSIONS: 'public."Sessions"',
    RATE_LIMIT: 'public."RateLimits"',
  },
};
