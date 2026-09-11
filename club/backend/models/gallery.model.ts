import mongoose, { Schema, Document } from "mongoose";


export interface IGallery extends Document {
  event: mongoose.Types.ObjectId;
  image: string[];
  important: boolean;
  type: string;
}


const gallerySchemas = new Schema({
  event: {
    type: mongoose.Types.ObjectId,
    ref: "Event",
    required: true
  },

  image: [{
    type: String,
    required: true
  }],
  important: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    required: true,
    trim: true
  }
});

const gallery = mongoose.model<IGallery>("Gallery", gallerySchemas);

export default gallery;