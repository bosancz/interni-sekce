import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SchemaTypes, Types } from "mongoose";

const mongoose = require("mongoose");

export enum MongoEventStatus {
  "draft" = "draft",
  "pending" = "pending",
  "public" = "public",
  "cancelled" = "cancelled",
  "rejected" = "rejected",
}

@Schema({ collection: "events", toObject: { virtuals: true } })
export class MongoEvent {
  _id!: Types.ObjectId;

  @Prop(
    raw({
      type: String,
      enum: ["draft", "pending", "public", "cancelled", "rejected"],
      required: true,
      default: "draft",
    }),
  )
  status?: MongoEventStatus;

  @Prop() statusNote?: string;
  @Prop() srcId?: number;
  @Prop({ type: String, required: true }) name!: string;
  @Prop() place?: string;
  @Prop() description?: string;
  @Prop() dateFrom?: Date;
  @Prop() dateTill?: Date;
  @Prop() timeFrom?: string;
  @Prop() timeTill?: string;
  @Prop() order?: number;
  @Prop() registration?: string;
  @Prop() accounting?: string;
  @Prop() announcement?: string;
  @Prop() groups?: [string];
  @Prop() leadersEvent?: boolean;
  @Prop({ type: String, default: "akce" }) type?: string;
  @Prop() subtype?: string;
  @Prop() srcType?: string;
  @Prop() leadersLine?: string;

  @Prop(
    raw({
      start: String,
      end: String,
    }),
  )
  meeting?: {
    start: string;
    end: string;
  };

  @Prop(
    raw([
      {
        type: SchemaTypes.ObjectId,
        ref: "Member",
        autopopulate: { select: "_id nickname name group role contacts.mobile" },
      },
    ]),
  )
  leaders?: unknown[];

  @Prop(
    raw([
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MongoMember",
        autopopulate: { select: "_id nickname name group role" },
      },
    ]),
  )
  attendees?: Types.ObjectId[];

  @Prop(
    raw([
      {
        id: String,
        amount: Number,
        type: { type: String },
        description: String,
      },
    ]),
  )
  expenses?: {
    id?: string;
    amount?: number;
    type?: string;
    description?: string;
  }[];

  @Prop(
    raw({
      water_km: Number,
      river: String,
    }),
  )
  competition?: {
    water_km: number;
    river: string;
  };
}

export const MongoEventSchema = SchemaFactory.createForClass(MongoEvent);
