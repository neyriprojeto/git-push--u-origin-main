// src/firebase/provider.tsx
'use client';
import {
  createContext,
  useContext,
  type ReactNode,
  type Context,
} from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export type FirebaseContextValue = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null;

const FirebaseContext = createContext<FirebaseContextValue>(null);

export function FirebaseProvider({
  value,
  children,
}: {
  value: FirebaseContextValue;
  children: ReactNode;
}) {
  return (
    <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
  );
}

// These hooks can be used in any client component to retrieve the Firebase instances.
// These hooks are safe to use in any client component that is a descendant of the FirebaseProvider.
// If you use them in a component that is not a descendant of the FirebaseProvider, they will throw an error.
export function useFirebase() {
  return useContext(FirebaseContext);
}
export function useFirebaseApp() {
  return useContext(FirebaseContext)?.app ?? null;
}
export function useFirestore() {
  return useContext(FirebaseContext)?.firestore ?? null;
}
export function useAuth() {
  return useContext(FirebaseContext)?.auth ?? null;
}

    