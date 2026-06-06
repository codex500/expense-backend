import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});

export const sendPushNotifications = async (messages: ExpoPushMessage[]) => {
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      // Workaround for Node 20 undici bug in expo-server-sdk
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN && {
            'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}`
          })
        },
        body: JSON.stringify(chunk),
      });
      
      const data = (await response.json()) as any;
      if (data && data.data) {
        tickets.push(...data.data);
      }
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
