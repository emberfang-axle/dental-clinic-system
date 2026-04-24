import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";

export type WithId<T> = T & { id: string };

export async function getDocTyped<T extends DocumentData>(collectionName: string, id: string) {
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as T) } as WithId<T>;
}

export async function setDocTyped<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: T
) {
  await setDoc(doc(db, collectionName, id), data);
}

export async function updateDocTyped<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>
) {
  await updateDoc(doc(db, collectionName, id), data as any);
}

export async function addDocTyped<T extends DocumentData>(collectionName: string, data: T) {
  const ref = await addDoc(collection(db, collectionName), data);
  return ref.id;
}

export async function deleteDocTyped(collectionName: string, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}

export async function listCollection<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const q = constraints.length
    ? query(collection(db, collectionName), ...constraints)
    : query(collection(db, collectionName));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })) as Array<WithId<T>>;
}

export function listenDoc<T extends DocumentData>(
  collectionName: string,
  id: string,
  cb: (value: WithId<T> | null) => void
) {
  return onSnapshot(doc(db, collectionName, id), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...(snap.data() as T) } as WithId<T>) : null);
  });
}

export function listenCollection<T extends DocumentData>(
  collectionName: string,
  cb: (values: Array<WithId<T>>) => void,
  constraints: QueryConstraint[] = []
) {
  const q = constraints.length
    ? query(collection(db, collectionName), ...constraints)
    : query(collection(db, collectionName));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })));
  });
}

// Convenience query helpers
export const qWhere = where;
export const qOrderBy = orderBy;