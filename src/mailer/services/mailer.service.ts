import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerSenderService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(
    email: string,
    subject: string,
    template: string,
    context: any,
  ) {
    return await this.mailerService.sendMail({
      to: email,
      subject,
      template,
      context,
    });
  }
}
