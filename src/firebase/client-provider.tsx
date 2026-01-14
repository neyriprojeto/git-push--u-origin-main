
'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, type FirebaseServices } from '@/firebase';
import { seedAdminUser } from '@/firebase/seed-admin';
import { onAuthStateChanged } from 'firebase/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const services = await initializeFirebase();
        setFirebaseServices(services);
        
        // Seed the admin user after services are initialized.
        // We use onAuthStateChanged to get the currently logged in user to check if it's the admin.
        if (services.auth && services.firestore) {
          const unsubscribe = onAuthStateChanged(services.auth, async (user) => {
            if (user && user.email === 'admin@adkairos.com') {
              await seedAdminUser(services.firestore!, user.uid);
            }
            // We only need to run this check once on initial load
            unsubscribe();
          });
        }
      } catch (error) {
        console.error("Failed to initialize Firebase:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []); 

  if (loading || !firebaseServices) {
    // You can render a loading spinner or some placeholder here
    return (
        <div className="flex h-screen w-full items-center justify-center">
            Carregando...
        </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
