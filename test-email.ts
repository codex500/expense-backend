import dotenv from 'dotenv';
dotenv.config();

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('📧 Sending test email via Resend default domain...');

  try {
    const { data, error } = await resend.emails.send({
      from: 'Trackify <onboarding@resend.dev>',
      to: 'djdivyeshchauhan@gmail.com',
      subject: '✅ Trackify Email Test - Working!',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Email Service Working!</h1>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 12px;">
              This is a test email from <strong>Trackify</strong> sent via <strong>Resend API</strong>.
            </p>
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Sent at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
            Trackify — Smart Expense Tracker
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Email failed:', error);
    } else {
      console.log('✅ Email sent successfully!');
      console.log('📬 Message ID:', data?.id);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testEmail();
