import mongoose, { Schema, Document, Types } from "mongoose";


interface IGroupInvite extends Document {
    groupId: Types.ObjectId;
    invitedBy: Types.ObjectId;
    invitedByModel: "User" | "Admin";
    invitedUser: Types.ObjectId;
    status: "pending" | "accepted" | "rejected";
}


const GroupInviteSchema = new Schema<IGroupInvite>(
    {
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "invitedByModel",
            required: true,
        },
        invitedByModel: {
            type: String,
            enum: ["User", "Admin"],
            required: true,
        },
        invitedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
    },
    { timestamps: true }
);

export default mongoose.model<IGroupInvite>("GroupInvite", GroupInviteSchema);