// import of this config module must be on the top of imports
import { configModule } from "./config-dynamic-module";

import { APP_FILTER } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DynamicModule, Module } from "@nestjs/common";

import { CoreModule } from "./core/core.module";
import { CoreConfig } from "./core/config/core.config";
import { TestingModule } from "./modules/testing/testing.module";
import { UserAccountsModule } from "./modules/user-accounts/user-accounts.module";
import { BloggersPlatformModule } from "./modules/bloggers-platform/bloggers-platform.module";

import { AllHttpExceptionsFilter } from "./core/exceptions/filters/all-exception.filter";
import { DomainHttpExceptionsFilter } from "./core/exceptions/filters/domain-exception.filter";

@Module({
  imports: [
    configModule,
    TypeOrmModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        const host = coreConfig.postgresURL;
        const port = coreConfig.postgresPort;
        const username = coreConfig.postgresUsername;
        const password = coreConfig.postgresPassword;
        const database = coreConfig.postgresDbName;

        return {
          type: "postgres",
          host,
          port,
          username,
          password,
          database,
          autoLoadEntities: false,
          synchronize: false,
          ssl: true,
        };
      },
      inject: [CoreConfig],
    }),
    CoreModule,
    TestingModule,
    UserAccountsModule,
    BloggersPlatformModule,
  ],
  controllers: [],
  providers: [
    //Первым сработает DomainHttpExceptionsFilter
    {
      provide: APP_FILTER,
      useClass: AllHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainHttpExceptionsFilter,
    },
  ],
})
export class AppModule {
  // eslint-disable-next-line
  static forRoot(coreConfig: CoreConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [],
    };
  }
}
