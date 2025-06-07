// import of this config module must be on the top of imports
import { configModule } from "./config-dynamic-module";

import { APP_FILTER } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
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
    MongooseModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        const uri = coreConfig.mongoURL;
        const dbName = coreConfig.mongoDbName;

        return {
          uri,
          dbName,
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
