'use client';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '..';

// We are defining a function that can be used to add a member to the database.
// This is a good practice because it allows us to reuse the same logic in different parts of the application.
export const addMember = async (firestore: any, memberData: any) => {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  try {
    await addDoc(collection(firestore, 'users'), {
      ...memberData,
      ativo: true, // Assuming new members are active by default
      criadoEm: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding document: ', error);
    throw new Error('Failed to add member to the database');
  }
};
