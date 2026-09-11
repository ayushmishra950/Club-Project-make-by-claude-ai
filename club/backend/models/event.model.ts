import mongoose, { Schema, Document, mongo } from "mongoose";


export interface IEvent extends Document {
   title: string;
   description: string;
   date: Date;
   location: string;
   createdBy: mongoose.Types.ObjectId;
   category: string;
   interestedCandidate: mongoose.Types.ObjectId[];
   gallery: mongoose.Types.ObjectId[];
   createdAt: Date;
   coverImage: string[];
   type: string;
   isPinned: boolean;
}


const EventSchemas = new Schema<IEvent>({
   title: {
      type: String,
      required: true,
      trim: true
   },
   description: {
      type: String,
      required: true,
      trim: true
   },
   date: {
      type: Date,
      required: true,
   },
   location: {
      type: String,
      required: true,
      trim: true
   },
   interestedCandidate: [{
      type: mongoose.Types.ObjectId,
      ref: "User"
   }],
   createdBy: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Admin"
   },
   createdAt: {
      type: Date,
      required: true,
   },
   category: {
      type: String,
      required: true,
      trim: true
   },
   coverImage: [{
      type: String,
      required: true,
      trim: true
   }],
   gallery: [{
      type: mongoose.Types.ObjectId,
      ref: "Gallery",
   }],
   type: {
      type: String,
      required: true,
      enum: ["public", "private"]
   },
   isPinned: {
      type: Boolean,
      default: false
   }
});

const Event = mongoose.model<IEvent>("Event", EventSchemas)

export default Event;