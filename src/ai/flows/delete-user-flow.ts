'use server';
/**
 * @fileOverview A Genkit flow for securely deleting a user from Firebase Authentication and Firestore.
 * This should only be callable by an administrator.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

// Ensure Firebase Admin is initialized
if (!getApps().length) {
  initializeApp();
}
const adminAuth = getAuth();
const adminFirestore = getFirestore();

export const DeleteUserInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
});
export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

export const DeleteUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteUserOutput = z.infer<typeof DeleteUserOutputSchema>;


export async function deleteUser(input: DeleteUserInput): Promise<DeleteUserOutput> {
    return deleteUserFlow(input);
}


const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: DeleteUserOutputSchema,
  },
  async (input) => {
    try {
      console.log(`Attempting to delete user with ID: ${input.userId}`);

      // 1. Delete user from Firebase Authentication
      await adminAuth.deleteUser(input.userId);
      console.log(`Successfully deleted user from Firebase Auth: ${input.userId}`);

      // 2. Delete user document from Firestore
      const userDocRef = adminFirestore.collection('users').doc(input.userId);
      await userDocRef.delete();
      console.log(`Successfully deleted user document from Firestore: ${input.userId}`);

      return {
        success: true,
        message: `User ${input.userId} has been deleted successfully from Authentication and Firestore.`,
      };
    } catch (error: any) {
      console.error(`Failed to delete user ${input.userId}:`, error);
      
      // Check if the user was not found, which can happen if one part succeeded and the other failed
      if (error.code === 'auth/user-not-found') {
         // Attempt to delete from Firestore anyway, in case it's an orphaned record.
         try {
            const userDocRef = adminFirestore.collection('users').doc(input.userId);
            await userDocRef.delete();
            return {
                success: true,
                message: `User was already deleted from Authentication. Removed from Firestore.`,
            };
         } catch (firestoreError) {
             console.error(`Firestore deletion also failed for orphaned user ${input.userId}:`, firestoreError);
             return {
                success: false,
                message: `User not found in Authentication, and failed to delete from Firestore.`,
             };
         }
      }

      return {
        success: false,
        message: error.message || 'An unknown error occurred during user deletion.',
      };
    }
  }
);
