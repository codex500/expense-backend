import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});

export const sendPushNotifications = async (messages: ExpoPushMessage[]) => {
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('[Push Service] Error sending push notification chunk:', error);
    }
  }

  // Optional: Handle receipts
  // For this simple implementation, we just fire and forget the messages
};

export const pushService = {
  sendPushNotifications,
};
