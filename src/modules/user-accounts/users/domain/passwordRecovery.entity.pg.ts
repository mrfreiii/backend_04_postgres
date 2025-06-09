import { add } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PasswordRecoveryEntity {
  constructor() {}

  recoveryCode: string;
  codeExpirationDate: number;
  userId: string;

  createInstance(userId: string): PasswordRecoveryEntity {
    const recoveryInfo = new PasswordRecoveryEntity();

    recoveryInfo.recoveryCode = uuidv4();
    recoveryInfo.codeExpirationDate = add(new Date(), {
      minutes: 2,
    }).getTime();
    recoveryInfo.userId = userId;

    return recoveryInfo;
  }
}
