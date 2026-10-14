import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DailyMenu, Reservation, AuthorizedUser, AppSettings } from '../types';

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// CRITIQUE : Toujours passer le databaseId provisionné
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation de la connexion à Firestore au démarrage
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: client appears offline.');
      return false;
    }
    // Si permission refusée sur 'test/connection' c'est normal avec les règles par défaut
    console.log('Firebase initialized and responsive.');
    return true;
  }
}

// Authentification Google
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Erreur de connexion Google:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// ==========================================
// Opérations Firestore pour Cantine
// ==========================================

// Menus
export async function fetchDailyMenuFromFirestore(dateStr: string): Promise<DailyMenu | null> {
  const path = 'menus';
  try {
    // Vérifier si un menu correspond à la date ou est actif
    const q = query(collection(db, path), where('date', '==', dateStr));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as DailyMenu;
    }
    // Sinon chercher un menu actif
    const qActive = query(collection(db, path), where('isActive', '==', true));
    const activeSnapshot = await getDocs(qActive);
    if (!activeSnapshot.empty) {
      return activeSnapshot.docs[0].data() as DailyMenu;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchAllMenusFromFirestore(): Promise<DailyMenu[]> {
  const path = 'menus';
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map((docSnap) => docSnap.data() as DailyMenu);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveDailyMenuToFirestore(menu: DailyMenu): Promise<DailyMenu> {
  const path = `menus/${menu.id}`;
  try {
    await setDoc(doc(db, 'menus', menu.id), {
      ...menu,
      updatedAt: new Date().toISOString(),
    });
    return menu;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDailyMenuFromFirestore(menuId: string): Promise<boolean> {
  const path = `menus/${menuId}`;
  try {
    await deleteDoc(doc(db, 'menus', menuId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Réservations
export async function fetchReservationsFromFirestore(dateStr: string): Promise<Reservation[]> {
  const path = 'reservations';
  try {
    const q = query(collection(db, path), where('date', '==', dateStr));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as Reservation);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveReservationToFirestore(reservation: Reservation): Promise<Reservation> {
  const path = `reservations/${reservation.id}`;
  try {
    await setDoc(doc(db, 'reservations', reservation.id), {
      ...reservation,
      userId: auth.currentUser?.uid || reservation.id,
    });
    return reservation;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateReservationInFirestore(
  id: string,
  updates: Partial<Reservation>
): Promise<boolean> {
  const path = `reservations/${id}`;
  try {
    await updateDoc(doc(db, 'reservations', id), updates);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReservationFromFirestore(id: string): Promise<boolean> {
  const path = `reservations/${id}`;
  try {
    await deleteDoc(doc(db, 'reservations', id));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Utilisateurs Autorisés
export async function fetchAuthorizedUsersFromFirestore(): Promise<AuthorizedUser[]> {
  const path = 'authorizedUsers';
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map((d) => d.data() as AuthorizedUser);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveAuthorizedUserToFirestore(user: AuthorizedUser): Promise<AuthorizedUser> {
  const path = `authorizedUsers/${user.id}`;
  try {
    await setDoc(doc(db, 'authorizedUsers', user.id), user);
    return user;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAuthorizedUserFromFirestore(id: string): Promise<boolean> {
  const path = `authorizedUsers/${id}`;
  try {
    await deleteDoc(doc(db, 'authorizedUsers', id));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Paramètres
export async function fetchSettingsFromFirestore(): Promise<AppSettings | null> {
  const path = 'settings/general';
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'general'));
    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveSettingsToFirestore(settings: AppSettings): Promise<AppSettings> {
  const path = 'settings/general';
  try {
    await setDoc(doc(db, 'settings', 'general'), {
      ...settings,
      id: 'general',
      updatedAt: new Date().toISOString(),
    });
    return settings;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Écoute temps réel des réservations
export function subscribeToReservations(
  dateStr: string,
  onUpdate: (reservations: Reservation[]) => void
): Unsubscribe {
  const path = 'reservations';
  const q = query(collection(db, path), where('date', '==', dateStr));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Reservation);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Initialise le test de connexion
testFirebaseConnection();
