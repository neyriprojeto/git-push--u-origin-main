
'use server';
/**
 * @fileOverview A Genkit flow that triggers on Firestore document updates
 * to send a welcome email when a new member's status is changed to "Ativo".
 */

import { onFlow } from '@genkit-ai/next';
import { z } from 'zod';
import { sendEmailTool } from '../tools/email-tool';

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
      
      // Call the sendEmailTool to send the welcome email.
      await sendEmailTool({
        to: memberEmail,
        subject: 'Seu cadastro no A.D.KAIROS CONNECT foi aprovado!',
        html: `
          <h1>Bem-vindo(a), ${memberName}!</h1>
          <p>Temos o prazer de informar que seu cadastro em nossa comunidade foi aprovado.</p>
          <p>Você já pode acessar a área de membros e desfrutar de todas as funcionalidades.</p>
          <p>Seja bem-vindo(a) à família A.D. Kairós!</p>
          <br>
          <p>Atenciosamente,</p>
          <p><strong>Ministério A.D. Kairós</strong></p>
        `,
      });

    } else {
      console.log('No status change to "Ativo", skipping email.');
    }
  }
);
