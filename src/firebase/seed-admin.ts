
'use client';

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const ADMIN_EMAIL = 'admin@adkairos.com';

// IMPORTANT: In a real-world scenario, you should have a secure way to find the admin's UID.
// For this app, we will assume a known, hardcoded UID for the admin user.
// This UID should correspond to the user created in Firebase Authentication with the email 'admin@adkairos.com'.
// You can get this UID from the Firebase Console -> Authentication section.
// Replace 'ADMIN_USER_UID_HERE' with the actual UID.
const ADMIN_UID = 'ADMIN_USER_UID_HERE'; // <--- Este valor será ignorado se o e-mail for encontrado, mas é um fallback.

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
 * @param adminUid - The actual UID of the logged-in admin user from Firebase Auth.
 */
export async function seedAdminUser(firestore: Firestore, adminUid: string) {
  if (!adminUid) {
    console.warn("Admin UID not provided to seed function. Seeding will be skipped.");
    return;
  }

  const adminRef = doc(firestore, 'users', adminUid);

  try {
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      console.log(`Admin user with UID ${adminUid} not found. Seeding data...`);
      await setDoc(adminRef, { ...adminData, id: adminUid });
      console.log("Admin user seeded successfully.");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}
