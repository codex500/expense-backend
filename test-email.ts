import 'dotenv/config';
import { emailService } from './src/modules/emails/emails.service';
import pool from './src/config/database';

async function testReminder() {
    try {
        const testEmail = 'djdivyeshchauhan@gmail.com';
        
        // Let's see if this user exists in DB to get their ID, if not, fake one.
        const res = await pool.query('SELECT id, full_name FROM user_profiles WHERE email = $1', [testEmail]);
        let userId;
        let fullName;
        
        if (res.rows.length > 0) {
            userId = res.rows[0].id;
            fullName = res.rows[0].full_name;
            console.log(`Found user ${userId} for ${testEmail}`);
        } else {
            console.log(`User not found, using generic test data.`);
            userId = 'test-id';
            fullName = 'Test User';
        }

        console.log(`Sending daily reminder to ${testEmail}...`);
        await emailService.sendDailyReminder(userId, testEmail, fullName);
        console.log(`Reminder email sent successfully!`);

    } catch (e) {
        console.error('Error sending reminder:', e);
    } finally {
        await pool.end();
    }
}

testReminder();
