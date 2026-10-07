import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_RECIPIENT_EMAIL } from "astro:env/server";

export type ContactState = {
  success: boolean;
  message: string;
};

// Form values go into the email's HTML body, so they must not be able to inject markup
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const server = {
  contact: defineAction({
    accept: "form",
    // Lenient on purpose: the handler returns the same messages the Next server action did
    input: z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      subject: z.string().optional(),
      message: z.string().optional(),
      company_url: z.string().optional(), // honeypot
    }),
    handler: async ({ name, email, subject, message, company_url }): Promise<ContactState> => {
      if (company_url) {
        return { success: true, message: "Message sent successfully!" };
      }

      if (!name || !email || !subject || !message) {
        return { success: false, message: "All fields are required." };
      }

      if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !BREVO_RECIPIENT_EMAIL) {
        return { success: false, message: "Email service is not configured." };
      }

      try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            sender: { email: BREVO_SENDER_EMAIL },
            to: [{ email: BREVO_RECIPIENT_EMAIL }],
            replyTo: { email, name },
            subject: `Contact Form: ${subject}`,
            htmlContent: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
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
    },
  }),
};
