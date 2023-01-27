import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SchemaTypes, Types } from "mongoose";

@Schema({
  collection: "users",
  toObject: { virtuals: true },
})
export class MongoUser {
  _id!: Types.ObjectId;

  @Prop() login?: string;
  @Prop() password?: string;
  @Prop() email?: string;
  @Prop() roles?: string[];
  @Prop() notifications?: string[];
  @Prop() loginCode?: string;
  @Prop() loginCodeExp?: string;

  @Prop(raw({ type: SchemaTypes.ObjectId, ref: "MongoMember" }))
  member?: Types.ObjectId;

  @Prop([{ type: SchemaTypes.Mixed, select: false }])
  pushSubscriptions?: any[];
}

export const MongoUserSchema = SchemaFactory.createForClass(MongoUser);
