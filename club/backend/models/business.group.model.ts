import mongoose, { Schema, Document } from "mongoose";

export interface IBusinessGroup extends Document {
  title: string;
  description: string;
  images: string[]; 
  imagesType:string;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  type:string;
  location:string;
  category:string;
}

const BusinessGroupSchema = new Schema<IBusinessGroup>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
    category:{
        type:String,
        required:true,
        trim:true
    },
    type:{
      type:String,
      enum:["public","private"],
      default:"public"
    },
    location:{
        type:String,
    },

    images: [
      {
        type: String,
      },
    ],

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const BusinessGroup = mongoose.model<IBusinessGroup>("BusinessGroup", BusinessGroupSchema);

export default BusinessGroup;