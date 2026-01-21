
'use server';
/**
 * @fileOverview A Genkit flow that triggers on Firestore document updates.
 * When a new member's status changes to "Ativo", it sends a welcome
 * email directly using nodemailer.
 */

import onFlow from '@genkit-ai/next';
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
    const churchLogoUrl = "https://images.unsplash.com/photo-1508345217145-6a58a75a74a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxjaHJpc3RpYW4lMjBjcm9zc3xlbnwwfHx8fDE3MjE4MzY3NzF8MA&ixlib=rb-4.1.0&q=80&w=200";

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

      const portalUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/login` : '#';

      // --- Email content ---
      // Plain text version for better deliverability
      const textContent = `
Bem-vindo(a) à A.D. Kairós Connect, ${memberName}!

É com grande alegria que confirmamos a aprovação do seu cadastro em nossa comunidade!

Agora você tem acesso completo à área de membros, onde poderá se conectar com a igreja, visualizar sua carteirinha digital, acompanhar os avisos e muito mais.

Para acessar o portal, copie e cole o seguinte link em seu navegador:
${portalUrl}

Seja bem-vindo(a) à família A.D. Kairós!

--
Ministério A.D. Kairós
Este é um e-mail automático. Por favor, não responda.
      `.trim();

      // HTML version with a robust, table-based layout for compatibility
      const htmlContent = `
<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-collapse: collapse; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td align="center" style="background-color: #0a2749; padding: 30px 20px; color: #ffffff;">
        <h1 style="font-size: 24px; margin: 0;">Bem-vindo(a) à A.D. Kairós Connect!</h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px 30px; color: #333333; font-size: 16px; line-height: 1.6;">
        <h2 style="font-size: 20px; margin: 0 0 20px 0; color: #0a2749;">Olá ${memberName},</h2>
        <p style="margin: 0 0 15px 0;">É com grande alegria que confirmamos a aprovação do seu cadastro em nossa comunidade!</p>
        <p style="margin: 0 0 25px 0;">Agora você tem acesso completo à área de membros, onde poderá se conectar com a igreja, visualizar sua carteirinha digital, acompanhar os avisos e muito mais.</p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center">
              <a href="${portalUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">Acessar o Portal</a>
            </td>
          </tr>
        </table>
        <p style="margin: 25px 0 0 0;">Seja bem-vindo(a) à família A.D. Kairós! Estamos felizes em ter você conosco.</p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td align="center" style="padding: 20px; background-color: #f9f9f9;">
        <img src="${churchLogoUrl}" alt="Logo da Igreja" width="100" style="display: block; border: 0; margin-bottom: 10px;" />
        <p style="font-size: 14px; color: #555555; margin: 0 0 10px 0;"><strong>Ministério A.D. Kairós</strong></p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 0 0 10px 0; width: 80%;">
        <p style="font-size: 12px; color: #777777; margin: 0;">Este é um e-mail automático. Por favor, não responda.</p>
      </td>
    </tr>
  </table>
</div>
      `;

      // Define mail options with both HTML and plain text
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: memberEmail,
        subject: 'Seu cadastro no A.D. Kairós Connect foi aprovado!',
        text: textContent,
        html: htmlContent,
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
