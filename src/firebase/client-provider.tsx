// src/firebase/client-provider.tsx
'use client';

import { useEffect, useState } from 'react';
import { FirebaseProvider, initializeFirebase } from '.';

// This provider is responsible for initializing Firebase on the client side.
// It should be used as a wrapper around the root layout of the application.
// It ensures that Firebase is initialized only once.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebase, setFirebase] = useState<any>(null);

  useEffect(() => {
    const app = initializeFirebase();
    setFirebase(app);
  }, []);

  return <FirebaseProvider value={firebase}>{children}</FirebaseProvider>;
}

    