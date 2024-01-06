import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({
  collection: "members",
})
export class MongoMember {
  _id!: Types.ObjectId;

  @Prop() srcId?: number;
  @Prop() nickname?: string;
  @Prop() group!: string;
  @Prop() role?: string;
  @Prop() function?: string;
  @Prop() rank?: string;
  @Prop({ type: Boolean, default: false }) inactive?: boolean;
  @Prop() membership?: string;
  @Prop() birthday?: Date;

  @Prop(
    raw({
      name: {
        first: String,
        last: String,
      },
    }),
  )
  name?: {
    first: string;
    last: string;
  };

  @Prop(
    raw({
      street: String,
      streetNo: String,
      city: String,
      postalCode: String,
      country: String,
    }),
  )
  address?: {
    street: string;
    streetNo: string;
    city: string;
    postalCode: string;
    country: string;
  };

  @Prop(
    raw({
      mobile: String,
      email: String,
      mother: String,
      father: String,
    }),
  )
  contacts?: {
    mobile: string;
    email: string;
    mother: string;
    father: string;
  };

  @Prop(
    raw([
      {
        id: String,
        dateFrom: Date,
        dateTill: Date,
      },
    ]),
  )
  achievements?: {
    id: string;
    dateFrom: Date;
    dateTill: Date;
  }[];
}

export const MongoMemberSchema = SchemaFactory.createForClass(MongoMember);
