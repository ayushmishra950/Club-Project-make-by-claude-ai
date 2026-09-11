import dotenv from "dotenv";
dotenv.config();
import twilio from "twilio";


const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_PHONE_NUMBER = process?.env.TWILIO_PHONE_NUMBER!;


if(!ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) throw new Error("account sid, api key secret, or twilio number is required.")

const client = twilio(ACCOUNT_SID, TWILIO_AUTH_TOKEN);


/* ================= SEND SIMPLE SMS ================= */
export const sendSMS = async ( to: string,    message: string) => {
  try {
    const sms = await client.messages.create({ body: message, from: TWILIO_PHONE_NUMBER, to });
    return sms;

  } catch (err) {
    console.log("SMS Error:", err);
    throw err;
  }
};

/* ================= GENERATE OTP ================= */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* ================= SEND OTP SMS ================= */
export const sendOtpSMS = async (
  phone: string,
  otp: string
) => {

  const message = `
Your OTP for verification is: ${otp}

Do not share this OTP with anyone.

- Club Team
`;

  return sendSMS(phone, message);
};

/* ================= SEND WELCOME SMS ================= */
export const sendWelcomeSMS = async (
  phone: string,
  fullName: string,
  password: string
) => {

  const message = `
Welcome ${fullName} 🎉

You have successfully joined our club.

Your login password is: ${password}

Please login and change your password to secure your account.

Website:
https://yourclubwebsite.com

Thank you for joining ❤️
`;

  return sendSMS(phone, message);
};



export const sendPasswordResetSMS = async (phone: string, resetLink: string) => {
   const message = `You requested a password reset for your account. Please click the following link to set a new password: ${resetLink}. This link will expire soon for your security. If you did not request this, please ignore this message.`;
   
   return sendSMS(phone, message);
}
