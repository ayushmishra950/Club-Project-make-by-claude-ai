import { Schema, model, Document, Types } from 'mongoose';

export interface IPasswordReset extends Document {
    userId: Types.ObjectId;
    /** SHA-256 of the token that was emailed. The token itself is never stored. */
    tokenHash: string;
    createdAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        /**
         * Storing the hash rather than the token means a leaked database dump
         * contains nothing an attacker can redeem, exactly as with passwords.
         * Lookup stays a single indexed query on the hash.
         */
        tokenHash: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        // TTL index: Mongo removes the document 15 minutes after it is created.
        createdAt: { type: Date, default: Date.now, expires: 900 },
    },
    {
        timestamps: false,
        versionKey: false
    }
);

passwordResetSchema.index({ userId: 1 });

export const PasswordReset = model<IPasswordReset>('PasswordReset', passwordResetSchema);
