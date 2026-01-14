'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, type FirebaseServices } from '@/firebase';
import { seedAdminUser } from '@/firebase/seed-admin';

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
        // Seed the admin user after services are initialized
        if (services.firestore) {
            await seedAdminUser(services.firestore);
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
