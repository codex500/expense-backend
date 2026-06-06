require('dotenv').config();
const { Client } = require('pg');
const { Expo } = require('expo-server-sdk');

async function testPushNotification() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    // Fetch the first active device token
    const { rows } = await client.query('SELECT token, user_id FROM device_tokens WHERE is_active = true LIMIT 1');
    
    if (rows.length === 0) {
      console.log('❌ No active device tokens found in the database. You need to log into the app first!');
      return;
    }

    const { token, user_id } = rows[0];
    console.log(`Found active token for user ${user_id}: ${token}`);

    // Create a new Expo client
    let expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
    });

    // Check if it's a valid Expo push token
    if (!Expo.isExpoPushToken(token)) {
      console.error(`❌ Push token ${token} is not a valid Expo push token`);
      return;
    }

    // The messages to send
    let messages = [{
      to: token,
      sound: 'default',
      title: 'Database Test Alert 🚀',
      body: 'This push notification was generated directly from the database script!',
      data: { url: 'trackifyapp://analytics' },
    }];

    console.log('Sending notification...');
    
    // Chunk and send
    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log('✅ Notification sent successfully!');
        console.log('Receipt Ticket:', ticketChunk);
      } catch (error) {
        console.error('❌ Error sending notification:', error);
      }
    }

  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await client.end();
  }
}

testPushNotification();
