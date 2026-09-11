import { Expo } from "expo-server-sdk";

const expo = new Expo();

export const sendPushNotification = async (
  pushToken: string,
  title: string,
  body: string,
  data?: any
) => {
  if (!Expo.isExpoPushToken(pushToken)) return;

  const messages = [
    {
      to: pushToken,
      sound: "default",
      title,
      body,
      data,
    },
  ];

  try {
    await expo.sendPushNotificationsAsync(messages);
  } catch (err) {
    console.log("Push Error:", err);
  }
};