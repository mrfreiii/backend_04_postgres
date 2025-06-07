import { HydratedDocument, Model } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import {
  ExtendedLikesInfo,
  ExtendedLikesInfoSchema,
} from "./extendedLikesInfo.schema";
import { UpdatePostDto } from "../dto/post.dto";
import { LikeStatusEnum } from "../../likes/enums/likes.enum";
import { CreatePostDomainDto } from "./dto/create-post.domain.dto";
import { UpdateLikesDto } from "./dto/update-likes.dto";

//флаг timestamp автоматичеки добавляет поля updatedAt и createdAt
/**
 * Post Entity Schema
 * This class represents the schema and behavior of a Post entity.
 */
@Schema({ timestamps: true })
export class Post {
  /**
   * Title
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  title: string;

  /**
   * Short description
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  shortDescription: string;

  /**
   * Content
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  content: string;

  /**
   * Blog id
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  blogId: string;

  /**
   * Blog name
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  blogName: string;

  /**
   * Creation timestamp
   * Explicitly defined despite timestamps: true
   * properties without @Prop for typescript so that they are in the class instance (or in instance methods)
   * @type {Date}
   */
  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: ExtendedLikesInfoSchema })
  extendedLikesInfo: ExtendedLikesInfo;

  /**
   * Deletion timestamp, nullable, if date exist, means entity soft deleted
   * @type {Date | null}
   */
  @Prop({ type: Date, default: null, nullable: true })
  deletedAt: Date | null;

  /**
   * Factory method to create a Post instance
   * @param {CreatePostDomainDto} dto - The data transfer object for post creation
   * @returns {PostDocument} The created post document
   */
  static createInstance(dto: CreatePostDomainDto): PostDocument {
    const post = new this();

    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = dto.blogName;
    post.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatusEnum.None,
      newestLikes: [],
    };

    return post as PostDocument;
  }

  /**
   * Marks the post as deleted
   * Throws an error if already deleted
   * @throws {Error} If the entity is already deleted
   */
  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error("Entity already deleted");
    }
    this.deletedAt = new Date();
  }

  /**
   * Updates the post instance with new data
   * @param {UpdatePostDto} dto - The data transfer object for post updates
   */
  update(dto: UpdatePostDto) {
    this.title = dto.title;
    this.shortDescription = dto.shortDescription;
    this.content = dto.content;
    this.blogId = dto.blogId;
    this.blogName = dto.blogName;
  }

  updateLikes(dto: UpdateLikesDto) {
    this.extendedLikesInfo.likesCount = dto.likesCount;
    this.extendedLikesInfo.dislikesCount = dto.dislikesCount;
    this.extendedLikesInfo.newestLikes = dto.newestLikes;
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);

//регистрирует методы сущности в схеме
PostSchema.loadClass(Post);

//Типизация документа
export type PostDocument = HydratedDocument<Post>;

//Типизация модели + статические методы
export type PostModelType = Model<PostDocument> & typeof Post;
