import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPurchaseEmails(userEmail, uniqueCode) {
  try {
    // Email to user
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: userEmail,
      subject: "Your Game Purchase Confirmation",
      html: `
        <h2>Thank you for your purchase!</h2>
        <p>Your unique access code is:</p>
        <pre style="font-size:20px;font-weight:bold;">${uniqueCode}</pre>
        <p>Keep this code safe—you’ll need it to play.</p>
      `,
    });

    // Notification to admin
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: "New Purchase Notification",
      html: `
        <h2>New Purchase Made</h2>
        <p>User email: ${userEmail}</p>
        <p>Unique code: ${uniqueCode}</p>
      `,
    });

    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    return false;
  }
}
