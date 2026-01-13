// src/firebase/firestore/use-collection.tsx
'use client';
import {
  onSnapshot,
  query,
  collection,
  where,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirestore } from '..';

export function useCollection<T>(path: string, field?: string, value?: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    let q: Query<DocumentData>;
    if (field && value) {
      q = query(collection(firestore, path), where(field, '==', value));
    } else {
      q = query(collection(firestore, path));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: T[] = [];
      snapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() } as T);
      });
      setData(results);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, path, field, value]);

  return { data, loading };
}

    