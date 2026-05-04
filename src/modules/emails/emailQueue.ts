import nodemailer from 'nodemailer';

const queue: nodemailer.SendMailOptions[] = [];
let transporter: nodemailer.Transporter | null = null;

/**
 * Initializes the queue with a nodemailer transporter.
 */
export const initEmailQueue = (t: nodemailer.Transporter) => {
    transporter = t;
};

/**
 * Adds a new email job to the in-memory queue.
 */
export const addToQueue = (job: nodemailer.SendMailOptions & { retryCount?: number }) => {
    if (job.retryCount === undefined) job.retryCount = 0;
    queue.push(job);
};

/**
 * Worker: Processes the queue at a fixed interval.
 * Throttles email sending to 1 email every 500ms (2 emails/sec).
 */
setInterval(async () => {
    if (!transporter || queue.length === 0) return;

    const job = queue.shift() as nodemailer.SendMailOptions & { retryCount: number };
    if (!job) return;

    try {
        // Send with 5-second timeout
        await Promise.race([
            transporter.sendMail(job),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("SMTP Timeout")), 5000)
            )
        ]);
        console.log(`[EmailQueue] ✅ Email sent to ${job.to}: ${job.subject}`);
    } catch (err: any) {
        if (job.retryCount < 1) {
            job.retryCount++;
            queue.push(job); // Retry exactly 1 time
            console.warn(`[EmailQueue] ⚠️ Retry 1/1 for ${job.to} due to: ${err.message}`);
        } else {
            console.error(`[EmailQueue] ❌ Email failed for ${job.to} after retry:`, err.message);
        }
    }
}, 500);
