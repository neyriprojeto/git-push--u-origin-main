'use client';

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const ADMIN_EMAIL = 'admin@adkairos.com';

// IMPORTANT: In a real-world scenario, you should have a secure way to find the admin's UID.
// For this app, we will assume a known, hardcoded UID for the admin user.
// This UID should correspond to the user created in Firebase Authentication with the email 'admin@adkairos.com'.
// You can get this UID from the Firebase Console -> Authentication section.
// Replace 'ADMIN_USER_UID_HERE' with the actual UID.
const ADMIN_UID = 'h2rEaH8pY1b5kO2wZ7sT8xY3jUe2'; // <--- REPLACE WITH YOUR ADMIN's ACTUAL UID FROM FIREBASE AUTH

const adminData = {
    nome: 'Administrador Principal',
    email: ADMIN_EMAIL,
    cargo: 'Administrador',
    status: 'Ativo',
    congregacao: 'SEDE',
    dataMembro: Timestamp.fromDate(new Date('2000-01-01')),
    dataBatismo: Timestamp.fromDate(new Date('2000-01-01')),
    dataNascimento: Timestamp.fromDate(new Date('2000-01-01')),
    recordNumber: '000',
    phone: '(11) 1234-5678',
    whatsapp: '(11) 91234-5678',
    logradouro: 'Rua Presidente Prudente',
    numero: '28',
    bairro: 'Eldorado',
    cidade: 'Diadema',
    estado: 'SP',
    cep: '09972-300',
    maritalStatus: 'N/A',
    gender: 'N/A',
    rg: '00.000.000-0',
    cpf: '000.000.000-00',
    naturalness: 'Diadema/SP',
    nationality: 'Brasileira',
    responsiblePastor: 'N/A',
    criadoEm: Timestamp.now(),
};

/**
 * Checks if the admin user exists in Firestore and creates it if it doesn't.
 * This is useful for initial setup to ensure the primary admin account has its data record.
 * @param firestore - The Firestore instance.
 */
export async function seedAdminUser(firestore: Firestore) {
  if (!ADMIN_UID || ADMIN_UID === 'ADMIN_USER_UID_HERE') {
    console.warn("Admin UID is not set. Seeding will be skipped. Please update 'src/firebase/seed-admin.ts'.");
    return;
  }

  const adminRef = doc(firestore, 'users', ADMIN_UID);

  try {
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      console.log(`Admin user with UID ${ADMIN_UID} not found. Seeding data...`);
      await setDoc(adminRef, adminData);
      console.log("Admin user seeded successfully.");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}
