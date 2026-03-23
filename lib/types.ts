export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
};

export type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
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
