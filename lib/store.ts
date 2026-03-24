"use client";

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./firebase";
import { Product, Sale, Settings, Expense } from "./types";

function uid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");
  return user.uid;
}

const DEFAULT_SETTINGS: Settings = {
  businessName: "Minha Loja",
  categories: ["Alimentos", "Bebidas", "Laticínios", "Limpeza", "Higiene", "Outros"],
};

export async function getSettings(): Promise<Settings> {
  const userId = uid();
  const snap = await getDoc(doc(db, "users", userId, "settings", "general"));
  if (!snap.exists()) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<Settings>) };
}

export async function saveSettings(data: Partial<Settings>): Promise<void> {
  const userId = uid();
  await setDoc(doc(db, "users", userId, "settings", "general"), data, { merge: true });
}

export async function getCategories(): Promise<string[]> {
  const s = await getSettings();
  return s.categories;
}

export async function getProducts(): Promise<Product[]> {
  const userId = uid();
  const snap = await getDocs(collection(db, "users", userId, "products"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }));
}

export async function addProduct(data: Omit<Product, "id">): Promise<Product> {
  const userId = uid();
  const ref = await addDoc(collection(db, "users", userId, "products"), data);
  return { id: ref.id, ...data };
}

export async function updateProduct(id: string, data: Omit<Product, "id">): Promise<Product> {
  const userId = uid();
  await updateDoc(doc(db, "users", userId, "products", id), data as Record<string, unknown>);
  return { id, ...data };
}

export async function deleteProduct(id: string): Promise<void> {
  const userId = uid();
  await deleteDoc(doc(db, "users", userId, "products", id));
}

export async function getSales(): Promise<Sale[]> {
  const userId = uid();
  const snap = await getDocs(
    query(collection(db, "users", userId, "sales"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Sale, "id">) }));
}

export async function addSale(data: Omit<Sale, "id" | "createdAt">): Promise<Sale> {
  const userId = uid();
  const createdAt = new Date().toISOString();
  const saleRef = doc(collection(db, "users", userId, "sales"));

  const itemsWithCost: Sale["items"] = [...data.items];

  await runTransaction(db, async (tx) => {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const productRef = doc(db, "users", userId, "products", item.productId);
      const productSnap = await tx.get(productRef);
      if (!productSnap.exists()) throw new Error("Produto não encontrado.");
      const data_ = productSnap.data();
      const currentStock = data_.stock as number;
      itemsWithCost[i] = { ...item, unitCost: (data_.cost as number) ?? 0 };
      tx.update(productRef, { stock: Math.max(0, currentStock - item.quantity) });
    }
    tx.set(saleRef, { ...data, items: itemsWithCost, createdAt });
  });

  return { id: saleRef.id, ...data, items: itemsWithCost, createdAt };
}

export async function login(email: string, password: string): Promise<boolean> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return true;
  } catch {
    return false;
  }
}

export async function getExpenses(): Promise<Expense[]> {
  const userId = uid();
  const snap = await getDocs(
    query(collection(db, "users", userId, "expenses"), orderBy("date", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expense, "id">) }));
}

export async function addExpense(data: Omit<Expense, "id">): Promise<Expense> {
  const userId = uid();
  const ref = await addDoc(collection(db, "users", userId, "expenses"), data);
  return { id: ref.id, ...data };
}

export async function updateExpense(id: string, data: Omit<Expense, "id">): Promise<void> {
  const userId = uid();
  await updateDoc(doc(db, "users", userId, "expenses", id), data as Record<string, unknown>);
}

export async function deleteExpense(id: string): Promise<void> {
  const userId = uid();
  await deleteDoc(doc(db, "users", userId, "expenses", id));
}
