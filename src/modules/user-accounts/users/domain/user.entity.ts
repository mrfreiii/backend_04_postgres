import { add } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { HydratedDocument, Model } from "mongoose";
import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";

import { Name, NameSchema } from "./name.schema";
import { CreateUserDomainDto } from "./dto/create-user.domain.dto";

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

//флаг timestamp автоматичеки добавляет поля updatedAt и createdAt
/**
 * User Entity Schema
 * This class represents the schema and behavior of a User entity.
 */
@Schema({ timestamps: true })
export class User {
  /**
   * Login of the user (must be uniq)
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  login: string;

  /**
   * Email of the user
   * @type {string}
   * @required
   */
  @Prop({ type: String, min: 5, required: true })
  email: string;

  /**
   * Password hash for authentication
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  passwordHash: string;

  /**
   * Email confirmation status (if not confirmed in 2 days account will be deleted)
   * @type {boolean}
   * @default false
   */
  @Prop({ type: Boolean, required: true, default: false })
  isEmailConfirmed: boolean;

  /**
   * Email confirmation code
   * @type {string}
   */
  @Prop({ type: String, required: false })
  confirmationCode: string;

  /**
   * Confirmation code expiration date
   * @type {number}
   */
  @Prop({ type: Number, required: false })
  confirmationCodeExpirationDate: number;

  /**
   * Password recovery code
   * @type {string}
   */
  @Prop({ type: String, required: false })
  passwordRecoveryCode: string;

  /**
   * Password recovery code expiration date
   * @type {number}
   */
  @Prop({ type: Number, required: false })
  passwordRecoveryCodeExpirationDate: number;

  @Prop({ type: NameSchema })
  name: Name;

  /**
   * Creation timestamp
   * Explicitly defined despite timestamps: true
   * properties without @Prop for typescript so that they are in the class instance (or in instance methods)
   * @type {Date}
   */
  createdAt: Date;
  updatedAt: Date;

  /**
   * Deletion timestamp, nullable, if date exist, means entity soft deleted
   * @type {Date | null}
   */
  @Prop({ type: Date, default: null, nullable: true })
  deletedAt: Date | null;

  /**
   * Virtual property to get the stringified ObjectId
   * @returns {string} The string representation of the ID
   * если ипсльзуете по всей системе шв айди как string, можете юзать, если id
   */
  get id() {
    // eslint-disable-next-line
    // @ts-ignore
    return this._id.toString();
  }

  /**
   * Factory method to create a User instance
   * @param {CreateUserDto} dto - The data transfer object for user creation
   * @returns {UserDocument} The created user document
   * DDD started: как создать сущность, чтобы она не нарушала бизнес-правила? Делегируем это создание статическому методу
   */
  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.login = dto.login;
    user.isEmailConfirmed = false;

    user.name = {
      firstName: "firstName xxx",
      lastName: "lastName yyy",
    };

    return user as UserDocument;
  }

  /**
   * Marks the user as deleted
   * Throws an error if already deleted
   * @throws {Error} If the entity is already deleted
   * DDD сontinue: инкапсуляция (вызываем методы, которые меняют состояние\св-ва) объектов согласно правилам этого объекта
   */
  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error("Entity already deleted");
    }
    this.deletedAt = new Date();
  }

  setConfirmationCode() {
    const code = uuidv4();

    this.confirmationCode = code;
    this.confirmationCodeExpirationDate = add(new Date(), {
      minutes: 2,
    }).getTime();

    return code;
  }

  confirmRegistration() {
    this.isEmailConfirmed = true;
  }

  setPasswordRecoveryCode() {
    const code = uuidv4();

    this.passwordRecoveryCode = code;
    this.passwordRecoveryCodeExpirationDate = add(new Date(), {
      minutes: 2,
    }).getTime();

    return code;
  }

  updatePassword(newPasswordHash: string) {
    this.passwordHash = newPasswordHash;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

//регистрирует методы сущности в схеме
UserSchema.loadClass(User);

//Типизация документа
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические методы
export type UserModelType = Model<UserDocument> & typeof User;
