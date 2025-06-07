import { HydratedDocument, Model } from "mongoose";
import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";

import { UpdateBlogDto } from "../dto/blog.dto";
import { CreateBlogDomainDto } from "./dto/create-blog.domain.dto";

//флаг timestamp автоматичеки добавляет поля updatedAt и createdAt
/**
 * Blog Entity Schema
 * This class represents the schema and behavior of a Blog entity.
 */
@Schema({ timestamps: true })
export class Blog {
  /**
   * Name of the blog
   * @type {string}
   * @required
   */
  @Prop({ type: String, max: 15, required: true })
  name: string;

  /**
   * Description of the blog
   * @type {string}
   * @required
   */
  @Prop({ type: String, max: 500, required: true })
  description: string;

  /**
   * WebsiteUrl
   * @type {string}
   * @required
   */
  @Prop({ type: String, max: 100, required: true })
  websiteUrl: string;

  /**
   * Creation timestamp
   * Explicitly defined despite timestamps: true
   * properties without @Prop for typescript so that they are in the class instance (or in instance methods)
   * @type {Date}
   */
  createdAt: Date;
  updatedAt: Date;

  /**
   * IsMembership
   * @type {boolean}
   */
  @Prop({ type: Boolean })
  isMembership: boolean;

  /**
   * Deletion timestamp, nullable, if date exist, means entity soft deleted
   * @type {Date | null}
   */
  @Prop({ type: Date, default: null, nullable: true })
  deletedAt: Date | null;

  /**
   * Factory method to create a Blog instance
   * @param {CreateBlogDomainDto} dto - The data transfer object for blog creation
   * @returns {BlogDocument} The created blog document
   */
  static createInstance(dto: CreateBlogDomainDto): BlogDocument {
    const blog = new this();

    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    blog.isMembership = false; // пока всегда false

    return blog as BlogDocument;
  }

  /**
   * Marks the blog as deleted
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
   * Updates the blog instance with new data
   * @param {UpdateBlogDto} dto - The data transfer object for blog updates
   */
  update(dto: UpdateBlogDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

//регистрирует методы сущности в схеме
BlogSchema.loadClass(Blog);

//Типизация документа
export type BlogDocument = HydratedDocument<Blog>;

//Типизация модели + статические методы
export type BlogModelType = Model<BlogDocument> & typeof Blog;
