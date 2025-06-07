import { CqrsModule } from "@nestjs/cqrs";
import { Global, Module } from "@nestjs/common";

import { CoreConfig } from "./config/core.config";
import { AuthConfig } from "../modules/user-accounts/auth/config/auth.config";
import { UsersConfig } from "../modules/user-accounts/users/config/users.config";
import { NotificationsConfig } from "../modules/notifications/config/notifications.config";
import { RateLimitModule } from "../modules/rateLimit/rate-limit.module";

//глобальный модуль для провайдеров и модулей необходимых во всех частях приложения (например LoggerService, CqrsModule, etc...)
@Global()
@Module({
  imports: [CqrsModule, RateLimitModule],
  exports: [
    CqrsModule,
    CoreConfig,
    NotificationsConfig,
    UsersConfig,
    AuthConfig,
    RateLimitModule,
  ],
  providers: [CoreConfig, NotificationsConfig, UsersConfig, AuthConfig],
})
export class CoreModule {}
