
'use server';
/**
 * @fileOverview A Genkit flow that triggers on Firestore document updates.
 * When a new member's status changes to "Ativo", it sends a welcome
 * email directly using nodemailer.
 */

import { onFlow } from '@genkit-ai/next';
import { z } from 'zod';
import { initializeApp, getApps } from 'firebase-admin/app';
import * as nodemailer from 'nodemailer';
import 'dotenv/config';


// Initialize Firebase Admin SDK if it hasn't been already.
if (!getApps().length) {
  initializeApp();
}

// Define the schema for the data we expect from the Firestore trigger event.
// This should match the structure of the 'users' documents.
const MemberDataSchema = z.object({
  email: z.string().email(),
  nome: z.string(),
  status: z.string(),
});

export const memberApprovalFlow = onFlow(
  {
    name: 'memberApprovalFlow',
    // Define the trigger for the flow. This will be a Firestore document update.
    trigger: {
      type: 'firestore',
      // The collection to watch. Using {wildcard} to capture the document ID.
      collection: 'users/{userId}',
      // We only care about 'update' events for approving existing members.
      event: ['update'],
    },
    // Define the input schema based on the Firestore trigger event.
    inputSchema: z.object({
      // `before` and `after` are the document snapshots provided by the trigger.
      before: MemberDataSchema,
      after: MemberDataSchema,
    }),
    outputSchema: z.void(),
  },
  async (data) => {
    console.log('Member approval flow triggered...');
    
    const beforeStatus = data.before.status;
    const afterStatus = data.after.status;
    const memberName = data.after.nome;
    const memberEmail = data.after.email;

    // Check if the status was changed from 'Pendente' to 'Ativo'.
    if (beforeStatus === 'Pendente' && afterStatus === 'Ativo') {
      console.log(`Approving member ${memberName} (${memberEmail}). Sending welcome email.`);
      
      // Check for required environment variables for email sending
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("Email environment variables (EMAIL_HOST, EMAIL_USER, EMAIL_PASS) are not set. Skipping email.");
        return;
      }

      // Create a transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER, // Your email user (for login)
          pass: process.env.EMAIL_PASS, // Your email password
        },
      });

      // Define the sender's name and address. Prioritize .env variables.
      const fromName = process.env.EMAIL_FROM_NAME || 'A.D. Kairós Connect';
      // Use the dedicated FROM address if provided, otherwise fallback to the user login email.
      const fromEmail = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;

      // Email content
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: memberEmail,
        subject: 'Seu cadastro no A.D. Kairós Connect foi aprovado!',
        html: `
          <h1>Bem-vindo(a), ${memberName}!</h1>
          <p>Temos o prazer de informar que seu cadastro em nossa comunidade foi aprovado.</p>
          <p>Você já pode acessar a área de membros e desfrutar de todas as funcionalidades.</p>
          <p>Seja bem-vindo(a) à família A.D. Kairós!</p>
          <br>
          <p>Atenciosamente,</p>
          <p><strong>Ministério A.D. Kairós</strong></p>
        `,
      };
      
      try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent successfully to ${memberEmail} from ${fromEmail}.`);
      } catch (error) {
        console.error(`Failed to send email to ${memberEmail}:`, error);
        // Optional: Add more robust error handling, like retries or logging to a different service.
      }

    } else {
      console.log('No status change to "Ativo", skipping email.');
    }
  }
);
