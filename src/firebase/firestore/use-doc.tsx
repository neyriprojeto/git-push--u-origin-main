// src/firebase/firestore/use-doc.tsx
'use client';
import {
  onSnapshot,
  doc,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirestore } from '..';

export function useDoc<T>(path: string, id?: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !id) {
      setLoading(false);
      return;
    }

    const docRef: DocumentReference<DocumentData> = doc(firestore, path, id);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setData({ id: snapshot.id, ...snapshot.data() } as T);
      } else {
        setData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, path, id]);

  return { data, loading };
}

    