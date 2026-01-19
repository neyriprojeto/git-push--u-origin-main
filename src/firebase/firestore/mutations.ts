
'use client';
import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp, setDoc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Helper function to generate a random 4-digit number as a string
const generate4DigitRecordNumber = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

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
    dataToSave.recordNumber = generate4DigitRecordNumber();
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

    try {
        await updateDoc(memberRef, dataToUpdate);
    } catch(error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: memberRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        }));
        // Re-throw error to be handled by the calling function
        throw error;
    }
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

export const updateCongregacao = async (firestore: Firestore, id: string, data: { endereco?: string; pastorId?: string; pastorName?: string; }) => {
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

export const addLeader = async (firestore: Firestore, leaderData: any) => {
    if (!firestore) throw new Error('Firestore is not initialized');
    const leadersRef = collection(firestore, 'leaders');
    addDoc(leadersRef, { ...leaderData, criadoEm: serverTimestamp() })
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: leadersRef.path,
                operation: 'create',
                requestResourceData: leaderData,
            }));
        });
};

export const updateLeader = async (firestore: Firestore, id: string, leaderData: any) => {
    if (!firestore) throw new Error('Firestore is not initialized');
    const leaderRef = doc(firestore, 'leaders', id);
    updateDoc(leaderRef, { ...leaderData, atualizadoEm: serverTimestamp() })
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: leaderRef.path,
                operation: 'update',
                requestResourceData: leaderData,
            }));
        });
};

export const deleteLeader = async (firestore: Firestore, id: string) => {
    if (!firestore) throw new Error('Firestore is not initialized');
    const leaderRef = doc(firestore, 'leaders', id);
    deleteDoc(leaderRef)
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: leaderRef.path,
                operation: 'delete',
            }));
        });
};

export const addLogo = async (firestore: Firestore, logoData: { name: string; imageUrl: string }) => {
    if (!firestore) throw new Error('Firestore is not initialized');
    const logosRef = collection(firestore, 'logos');
    addDoc(logosRef, { ...logoData, criadoEm: serverTimestamp() })
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: logosRef.path,
                operation: 'create',
                requestResourceData: logoData,
            }));
        });
};

export const deleteLogo = async (firestore: Firestore, id: string) => {
    if (!firestore) throw new Error('Firestore is not initialized');
    const logoRef = doc(firestore, 'logos', id);
    deleteDoc(logoRef)
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: logoRef.path,
                operation: 'delete',
            }));
        });
};

export const addPost = async (firestore: Firestore, postData: any) => {
    if (!firestore) throw new Error('Firestore is not initialized');
    const postsRef = collection(firestore, 'posts');
    addDoc(postsRef, { ...postData, createdAt: serverTimestamp() })
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: postsRef.path,
                operation: 'create',
                requestResourceData: postData,
            }));
        });
};

export const deletePost = async (firestore: Firestore, postId: string) => {
    if (!firestore) throw new Error('Firestore is not initialized');
    const postRef = doc(firestore, 'posts', postId);
    deleteDoc(postRef)
        .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: postRef.path,
                operation: 'delete',
            }));
        });
};

export const addMessage = async (firestore: Firestore, messageData: any) => {
    if (!firestore) throw new Error('Firestore is not initialized');
    const messagesRef = collection(firestore, 'messages');

    try {
        // Await the creation of the message document to get its reference
        const messageDocRef = await addDoc(messagesRef, { ...messageData, createdAt: serverTimestamp() });
        
        // After successfully creating the message, update the user's document
        if (messageData.userId) {
            const userRef = doc(firestore, 'users', messageData.userId);
            // Use updateDoc with arrayUnion to add the new message ID. This is idempotent.
            await updateDoc(userRef, {
                messageIds: arrayUnion(messageDocRef.id)
            });
        }
    } catch (error: any) {
        // Handle potential errors during message creation or user doc update
        const path = (error.code === 'permission-denied' && error.target?.path) ? error.target.path : messagesRef.path;
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: path,
            operation: 'create', // or 'update' depending on where it failed
            requestResourceData: messageData,
        }));
        // Re-throw the error so the UI can be notified
        throw error;
    }
};


export const addReplyToMessage = async (firestore: Firestore, messageId: string, replyData: any) => {
    if (!firestore) throw new Error('Firestore is not initialized');
    const messageRef = doc(firestore, 'messages', messageId);
    
    const dataToUpdate = {
        replies: arrayUnion({
            ...replyData,
            createdAt: Timestamp.now()
        })
    };
    
    try {
        await updateDoc(messageRef, dataToUpdate);
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: messageRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        }));
        throw error;
    }
};

export const deleteMessage = async (firestore: Firestore, messageId: string) => {
    if (!firestore) throw new Error('Firestore is not initialized');
    const messageRef = doc(firestore, 'messages', messageId);
    try {
        await deleteDoc(messageRef);
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: messageRef.path,
            operation: 'delete',
        }));
        throw error;
    }
};
