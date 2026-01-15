'use client';
import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const addMember = async (firestore: Firestore, uid: string | undefined, memberData: any) => {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  const dataToSave = {
    ...memberData,
    status: 'Pendente',
    criadoEm: serverTimestamp(),
  };

  if (!dataToSave.recordNumber) {
    dataToSave.recordNumber = new Date().getTime().toString();
  }

  // If a UID is provided (from Auth), use it as the document ID.
  // Otherwise, let Firestore auto-generate an ID.
  const memberRef = uid ? doc(firestore, 'users', uid) : doc(collection(firestore, 'users'));

  // Use the reference to set the document data.
  setDoc(memberRef, dataToSave)
    .catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: memberRef.path,
        operation: 'create',
        requestResourceData: dataToSave,
      }));
    });
};


export const updateMember = async (firestore: Firestore, uid: string, memberData: any) => {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }
    
    const memberRef = doc(firestore, 'users', uid);
    const dataToUpdate = {
        ...memberData,
        atualizadoEm: serverTimestamp(),
    };

    updateDoc(memberRef, dataToUpdate)
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: memberRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate,
            }));
        });
};


export const addCongregacao = async (firestore: Firestore, nome: string) => {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }
    if (!nome || nome.trim() === '') {
        throw new Error('Congregation name cannot be empty');
    }
    
    const congregacoesRef = collection(firestore, 'congregacoes');
    const dataToAdd = {
        nome: nome,
        criadaEm: serverTimestamp(),
    };

    addDoc(congregacoesRef, dataToAdd)
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: congregacoesRef.path,
                operation: 'create',
                requestResourceData: dataToAdd,
            }));
        });
}

export const updateCongregacao = async (firestore: Firestore, id: string, data: { endereco?: string }) => {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }
    const congregacaoRef = doc(firestore, 'congregacoes', id);
    updateDoc(congregacaoRef, data)
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: congregacaoRef.path,
                operation: 'update',
                requestResourceData: data,
            }));
        });
};

export const deleteCongregacao = async (firestore: Firestore, id: string) => {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }
    const congregacaoRef = doc(firestore, 'congregacoes', id);
    deleteDoc(congregacaoRef)
        .catch(error => {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: congregacaoRef.path,
                operation: 'delete',
            }));
        });
}
