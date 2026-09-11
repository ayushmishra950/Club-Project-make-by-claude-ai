import mongoose from "mongoose";

const connectDb = async () => {
  const mongoUrl = process.env.MONGO_URI;

  if (!mongoUrl) {
    console.log("Mongo URL not found");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUrl);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDb;
