import { MailerService } from "@nestjs-modules/mailer";
import { EmailService } from "../../modules/notifications/application/email.service";

export class EmailServiceMock extends EmailService {
  static service: EmailServiceMock;

  constructor(mailerService: MailerService) {
    super(mailerService);

    if (EmailServiceMock.service) {
      return EmailServiceMock.service;
    }
    EmailServiceMock.service = this;
  }

  async sendEmailWithConfirmationCode({
    // eslint-disable-next-line
    email,
    // eslint-disable-next-line
    confirmationCode,
    // eslint-disable-next-line
    currentURL,
  }: {
    email: string;
    confirmationCode: string;
    currentURL: string;
  }) {
    return Promise.resolve();
  }

  async sendEmailWithPasswordRecoveryCode({
    // eslint-disable-next-line
    email,
    // eslint-disable-next-line
    recoveryCode,
    // eslint-disable-next-line
    currentURL,
  }: {
    email: string;
    recoveryCode: string;
    currentURL: string;
  }) {
    return Promise.resolve();
  }
}
