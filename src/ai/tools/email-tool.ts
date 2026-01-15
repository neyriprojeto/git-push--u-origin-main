
'use server';
/**
 * @fileOverview A tool for sending emails using the Resend service.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';

// Ensure the API key is loaded from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

const SendEmailSchema = z.object({
  to: z.string().email().describe('The recipient\'s email address.'),
  subject: z.string().describe('The subject of the email.'),
  html: z.string().describe('The HTML content of the email.'),
});

export const sendEmailTool = ai.defineTool(
  {
    name: 'sendEmail',
    description: 'Sends an email to a specified recipient.',
    inputSchema: SendEmailSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input) => {
    try {
      await resend.emails.send({
        from: 'A.D.KAIROS CONNECT <onboarding@resend.dev>', // Must be a verified domain on Resend
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
      console.log(`Email sent successfully to ${input.to}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to send email:', error);
      // It's better to not throw here to prevent the flow from crashing,
      // but to return a failure status. The flow can then decide how to handle it.
      return { success: false };
    }
  }
);
