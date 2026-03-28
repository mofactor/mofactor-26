"use server";

export type ContactState = {
  success: boolean;
  message: string;
} | null;

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const honeypot = formData.get("company_url") as string;
  if (honeypot) {
    return { success: true, message: "Message sent successfully!" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !subject || !message) {
    return { success: false, message: "All fields are required." };
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const recipientEmail = process.env.BREVO_RECIPIENT_EMAIL;

  if (!apiKey || !senderEmail || !recipientEmail) {
    return { success: false, message: "Email service is not configured." };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail },
        to: [{ email: recipientEmail }],
        replyTo: { email, name },
        subject: `Contact Form: ${subject}`,
        htmlContent: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        `,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      console.error("Brevo API error:", res.status, errorBody);
      return { success: false, message: "Failed to send message. Please try again." };
    }

    return { success: true, message: "Message sent successfully!" };
  } catch {
    return { success: false, message: "Something went wrong. Please try again later." };
  }
}
