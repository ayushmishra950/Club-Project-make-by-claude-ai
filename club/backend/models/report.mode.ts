import mongoose, { Schema, Document, Types } from "mongoose";


export interface IReport extends Document {

  reportedBy: Types.ObjectId;

  reportedUser?: Types.ObjectId | null;

  reportType:
    | "user"
    | "post"
    | "comment"
    | "message"
    | "group"
    | "event";

  reportedItemId?: Types.ObjectId | null;

  reason:
    | "Spam"
    | "Fake Profile"
    | "Harassment or Bullying"
    | "Inappropriate Content"
    | "Hate Speech"
    | "Violence or Threats"
    | "Other";

  description?: string;

  status:
    | "pending"
    | "reviewed"
    | "resolved"
    | "rejected";

  actionTaken:
    | "none"
    | "warning"
    | "content_removed"
    | "user_blocked"
    | "account_deleted";

  reviewedBy?: Types.ObjectId | null;

  adminNote?: string;

  reviewedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}



const ReportSchema = new Schema<IReport>(
  {

    // User who created report
    reportedBy:{
      type:Schema.Types.ObjectId,
      ref:"User",
      required:true,
    },


    // User against whom report is created
    reportedUser:{
      type:Schema.Types.ObjectId,
      ref:"User",
      default:null,
    },


    // What is reported
    reportType:{
      type:String,
      enum:[
        "user",
        "post",
        "comment",
        "message",
        "group",
        "event",
      ],
      required:true,
    },


    // Post/Comment/Message/Group/Event ID
    reportedItemId:{
      type:Schema.Types.ObjectId,
      default:null,
    },


    reason:{
      type:String,
      enum:[
        "Spam",
        "Fake Profile",
        "Harassment or Bullying",
        "Inappropriate Content",
        "Hate Speech",
        "Violence or Threats",
        "Other",
      ],
      required:true,
    },


    description:{
      type:String,
      trim:true,
      maxlength:500,
      default:"",
    },


    // Admin review status
    status:{
      type:String,
      enum:[
        "pending",
        "reviewed",
        "resolved",
        "rejected",
      ],
      default:"pending",
    },


    // Action taken by admin
    actionTaken:{
      type:String,
      enum:[
        "none",
        "warning",
        "content_removed",
        "user_blocked",
        "account_deleted",
      ],
      default:"none",
    },


    // Admin who handled report
    reviewedBy:{
      type:Schema.Types.ObjectId,
      ref:"User",
      default:null,
    },


    adminNote:{
      type:String,
      maxlength:500,
      default:"",
    },


    reviewedAt:{
      type:Date,
      default:null,
    },


  },
  {
    timestamps:true,
  }
);



export default mongoose.model<IReport>(
  "Report",
  ReportSchema
);