import { add } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RegistrationEntity {
  confirmationCode: string;
  codeExpirationDate: number;
  userId: string;

  constructor() {}

  createInstance(userId: string): RegistrationEntity {
    const registrationInfo = new RegistrationEntity();

    registrationInfo.confirmationCode = uuidv4();
    registrationInfo.codeExpirationDate = add(new Date(), {
      minutes: 2,
    }).getTime();
    registrationInfo.userId = userId;

    return registrationInfo;
  }
}
