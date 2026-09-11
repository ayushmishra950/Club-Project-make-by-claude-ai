 import User from "../models/user.model.js";


export const verifyUser = async (userId: string) => {
  if (!userId) {
    throw new Error("User ID not found.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  // Check if blocked first
  if (user.blocked) {
    throw new Error("Your account has been temporarily blocked. Please contact the administration for further assistance.");
  }

  // Then check verification
  if (!user.isVerified) {
    throw new Error("You are not verified. Please contact the admin.");
  }

  return { success: true };
};