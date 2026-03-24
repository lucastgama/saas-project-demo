export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
};

export type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  total: number;
};

export type Sale = {
  id: string;
  items: SaleItem[];
  total: number;
  paymentMethod: "cash" | "card" | "pix";
  createdAt: string;
  note?: string;
};

export type Expense = {
  id: string;
  name: string;
  value: number;
  date: string;
};

export type Settings = {
  businessName: string;
  categories: string[];
};
