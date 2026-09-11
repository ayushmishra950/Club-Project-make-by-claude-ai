import mongoose, { Schema, Document } from "mongoose";

export interface IDonation extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  category: string;
  createdAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    category: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Donation = mongoose.model<IDonation>("Donation", DonationSchema);
export default Donation;