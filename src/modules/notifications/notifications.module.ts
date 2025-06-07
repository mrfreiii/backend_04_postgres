import { NotificationsConfig } from "./config/notifications.config";

import { Module } from "@nestjs/common";

import { MailerModule } from "@nestjs-modules/mailer";
import { EmailService } from "./application/email.service";

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (notificationsConfig: NotificationsConfig) => {
        const login = notificationsConfig.emailAccount;
        const password = notificationsConfig.emailAccountPassword;

        return {
          // Work option #1:
          // transport: {
          //   service: "gmail",
          //   auth: {
          //     user: login,
          //     pass: password,
          //   },
          // },
          // Work option #2:
          transport: `smtps://${login}:${password}@smtp.gmail.com`,
          defaults: {
            from: "Backend_03 <modules@nestjs.com>",
          },
        };
      },
      inject: [NotificationsConfig],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}
