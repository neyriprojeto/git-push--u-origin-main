
'use client';
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '..';

// We are defining a function that can be used to add a member to the database.
// This is a good practice because it allows us to reuse the same logic in different parts of the application.
export const addMember = async (firestore: any, memberData: any) => {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  try {
    const dataToSave = {
      ...memberData,
      ativo: false, // New members are inactive until approved
      status: 'Pendente', // Set status to pending for admin approval
      tipo: 'membro', // All public registrations are for members
      criadoEm: serverTimestamp(),
    };

    // Remove recordNumber if it's empty, as it will be generated automatically
    if (!dataToSave.recordNumber) {
        // In a real scenario, you'd generate a unique ID here.
        // For now, we'll use a timestamp as a placeholder.
        dataToSave.recordNumber = new Date().getTime().toString();
    }

    await addDoc(collection(firestore, 'users'), dataToSave);
  } catch (error) {
    console.error('Error adding document: ', error);
    throw new Error('Failed to add member to the database');
  }
};


export const addCongregacao = async (firestore: any, nome: string) => {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }
    if (!nome || nome.trim() === '') {
        throw new Error('Congregation name cannot be empty');
    }

    try {
        await addDoc(collection(firestore, 'congregacoes'), {
            nome: nome,
            criadaEm: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error adding congregation: ', error);
        throw new Error('Failed to add congregation to the database');
    }
}

export const deleteCongregacao = async (firestore: any, id: string) => {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }
    try {
        await deleteDoc(doc(firestore, 'congregacoes', id));
    } catch (error) {
        console.error('Error deleting congregation: ', error);
        throw new Error('Failed to delete congregation from the database');
    }
}
