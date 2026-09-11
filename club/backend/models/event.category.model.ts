import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
   name:string;
   description:string;
   createdBy:mongoose.Types.ObjectId;
  createdAt: Date;
}

const eventCategorySchema = new Schema<ICategory>(
  {
   name:{
    type:String,
    required:true,
    trim: true
   },
   description:{
    type:String,
    trim:true
   },
   createdBy:{
    type:mongoose.Types.ObjectId,
    required:true
   }
  },
  {
    timestamps: true
  }
);

const Category = mongoose.model<ICategory>("Category", eventCategorySchema);
export default Category;