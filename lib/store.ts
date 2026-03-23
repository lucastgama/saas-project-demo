"use client";

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./firebase";
import { Product, Sale } from "./types";

// ── helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");
  return user.uid;
}

// ── seed data ─────────────────────────────────────────────────────────────────

const SEED_PRODUCTS: Product[] = [
  { id: "p1", name: "Arroz 5kg",          category: "Alimentos", price: 28.9,  stock: 40, minStock: 10, unit: "pct" },
  { id: "p2", name: "Feijão 1kg",         category: "Alimentos", price: 8.5,   stock: 5,  minStock: 8,  unit: "pct" },
  { id: "p3", name: "Óleo de Soja 900ml", category: "Alimentos", price: 7.9,   stock: 22, minStock: 10, unit: "un"  },
  { id: "p4", name: "Refrigerante 2L",    category: "Bebidas",   price: 9.0,   stock: 3,  minStock: 6,  unit: "un"  },
  { id: "p5", name: "Café 500g",          category: "Bebidas",   price: 15.99, stock: 18, minStock: 5,  unit: "pct" },
  { id: "p6", name: "Açúcar 1kg",         category: "Alimentos", price: 5.5,   stock: 30, minStock: 10, unit: "pct" },
  { id: "p7", name: "Sal 1kg",            category: "Alimentos", price: 2.99,  stock: 25, minStock: 5,  unit: "pct" },
  { id: "p8", name: "Leite 1L",           category: "Laticínios",price: 4.99,  stock: 2,  minStock: 12, unit: "un"  },
];

export async function seedIfEmpty(): Promise<void> {
  const userId = uid();
  const snap = await getDocs(collection(db, "users", userId, "products"));
  if (!snap.empty) return;
  for (const p of SEED_PRODUCTS) {
    const { id, ...data } = p;
    await setDoc(doc(db, "users", userId, "products", id), data);
  }
}

// ── products ─────────────────────────────────────────────────────────────────

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

// ── sales ─────────────────────────────────────────────────────────────────────

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
  const saleData: Omit<Sale, "id"> = { ...data, createdAt };
  const saleRef = doc(collection(db, "users", userId, "sales"));

  await runTransaction(db, async (tx) => {
    for (const item of data.items) {
      const productRef = doc(db, "users", userId, "products", item.productId);
      const productSnap = await tx.get(productRef);
      if (!productSnap.exists()) throw new Error("Produto não encontrado.");
      const currentStock = productSnap.data().stock as number;
      tx.update(productRef, { stock: Math.max(0, currentStock - item.quantity) });
    }
    tx.set(saleRef, saleData);
  });

  return { id: saleRef.id, ...saleData };
}

// ── auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<boolean> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return true;
  } catch {
    return false;
  }
}
