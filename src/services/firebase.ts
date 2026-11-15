import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import type { CareCircleState, CareRole, RolePasscodeRecord } from '@/types/domain';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'kindredcare-catalyst.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kindredcare-catalyst',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'kindredcare-catalyst.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export function isFirebaseCloudConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      firebaseConfig.projectId
  );
}

export function getFirebaseFirestore(): Firestore | null {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return null;
  }
  try {
    if (!firebaseApp) {
      firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    }
    if (!firestoreDb) {
      firestoreDb = getFirestore(firebaseApp);
    }
    return firestoreDb;
  } catch {
    return null;
  }
}

/**
 * Syncs the Care Circle state and user records to Google Cloud Firestore when configured.
 */
export async function syncCareCircleToFirestore(
  state: CareCircleState,
  passcodeRecords?: RolePasscodeRecord[]
): Promise<boolean> {
  const db = getFirebaseFirestore();
  if (!db) return false;

  try {
    const circleRef = doc(db, 'careCircles', state.circleId);
    await setDoc(
      circleRef,
      {
        ...state,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    if (passcodeRecords && passcodeRecords.length > 0) {
      for (const member of state.members) {
        const userRef = doc(db, 'users', `${state.circleId}_${member.role}`);
        const matchingPin = passcodeRecords.find((r) => r.role === member.role);
        await setDoc(
          userRef,
          {
            circleId: state.circleId,
            role: member.role,
            name: member.name,
            nameLower: member.name.trim().toLowerCase(),
            relation: member.relation,
            email: member.email,
            phone: member.phone,
            salt: matchingPin?.salt || '',
            hash: matchingPin?.hash || '',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function saveUserRegistrationToFirestore(user: {
  circleId: string;
  role: CareRole;
  name: string;
  email: string;
  phone: string;
  relation: string;
  salt: string;
  hash: string;
}): Promise<boolean> {
  const db = getFirebaseFirestore();
  if (!db) return false;
  try {
    const userRef = doc(db, 'users', `${user.circleId}_${user.role}`);
    await setDoc(
      userRef,
      {
        ...user,
        nameLower: user.name.trim().toLowerCase(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads a Care Circle document from Google Cloud Firestore by circleCode or circleId.
 */
export async function fetchCareCircleFromFirestore(
  circleCode: string
): Promise<CareCircleState | null> {
  const db = getFirebaseFirestore();
  if (!db) return null;

  try {
    const directRef = doc(db, 'careCircles', circleCode.toLowerCase());
    const snap = await getDoc(directRef);
    if (snap.exists()) {
      return snap.data() as CareCircleState;
    }

    const q = query(
      collection(db, 'careCircles'),
      where('circleCode', '==', circleCode.toUpperCase())
    );
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return querySnap.docs[0].data() as CareCircleState;
    }
    return null;
  } catch {
    return null;
  }
}
