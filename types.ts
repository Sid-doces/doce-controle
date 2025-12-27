
export type Category = 'Bolo' | 'Torta' | 'Doce' | 'Outros';

export type PaymentMethod = 'PIX' | 'Dinheiro' | 'Cartão' | 'iFood';

export type OrderStatus = 'Pendente' | 'Entregue';

export interface ProductIngredient {
  stockItemId: string;
  quantity: number; 
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  cost: number;
  price: number;
  category: Category;
  quantity: number;
  yield: number;
  ingredients: ProductIngredient[];
  image?: string; 
  utilityPercent?: number; // Gás, Energia, Água
}

export interface Production {
  id: string;
  productId: string;
  productName: string;
  quantityProduced: number;
  totalCost: number;
  date: string;
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  unitPrice: number;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  discount: number;
  costUnitary: number;
  paymentMethod: PaymentMethod;
  date: string;
  sellerId?: string;
  sellerName?: string;
  commissionValue?: number;
}

export interface Order {
  id: string;
  customerId?: string; 
  clientName: string;
  productName: string;
  deliveryDate: string;
  value: number;
  cost: number; 
  paymentMethod: PaymentMethod;
  status: OrderStatus;
}

export interface Expense {
  id: string;
  description: string;
  value: number;
  date: string;
  isFixed: boolean;
}

export interface Collaborator {
  id: string;
  email: string;
  role: 'Auxiliar' | 'Sócio' | 'Vendedor';
  addedAt: string;
}

export interface AppState {
  user: { 
    email: string;
    name?: string;
    role?: 'Dono' | 'Sócio' | 'Auxiliar' | 'Vendedor';
    ownerEmail?: string;
  } | null;
  settings?: {
    commissionRate: number;
  };
  products: Product[];
  stock: StockItem[];
  sales: Sale[];
  orders: Order[];
  expenses: Expense[];
  collaborators: Collaborator[];
  customers: Customer[];
  productions: Production[]; 
}
