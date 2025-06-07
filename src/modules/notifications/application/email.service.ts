import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  private async sendEmail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
    } catch (err) {
      console.log(`Email transport error: ${err}`);
    }
  }

  async sendEmailWithConfirmationCode({
    email,
    confirmationCode,
    currentURL,
  }: {
    email: string;
    confirmationCode: string;
    currentURL: string;
  }) {
    const link = `${currentURL}/auth/registration-confirmation?code=${confirmationCode}`;

    const html = `
            <h1>Thanks for your registration</h1>
            <p>To finish registration please follow the link below:
                <a href=${link}>complete registration</a>
            </p>
        `;

    await this.sendEmail({
      to: email,
      subject: "Подтверждение регистрации",
      html,
    });
  }

  async sendEmailWithPasswordRecoveryCode({
    email,
    recoveryCode,
    currentURL,
  }: {
    email: string;
    recoveryCode: string;
    currentURL: string;
  }) {
    const link = `${currentURL}/auth/password-recovery?recoveryCode=${recoveryCode}`;

    const html = `
            <h1>Password recovery</h1>
            <p>To finish password recovery please follow the link below:
                <a href=${link}>recovery password</a>
            </p>
        `;

    await this.sendEmail({
      to: email,
      subject: "Восстановление пароля",
      html,
    });
  }
}
