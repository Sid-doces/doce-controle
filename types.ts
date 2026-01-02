
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
  purchaseCount?: number; // Para fidelidade
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
  utilityPercent?: number; 
  targetMargin?: number; 
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

export interface Loss {
  id: string;
  description: string;
  type: 'Insumo' | 'Produto';
  refId: string; // ID do item ou produto
  quantity: number;
  value: number; // Custo total da perda
  date: string;
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
  customerId?: string; // Vínculo para fidelidade
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
  commissionRate?: number;
}

export interface AppState {
  user: { 
    email: string;
    name?: string;
    role?: 'Dono' | 'Sócio' | 'Auxiliar' | 'Vendedor';
    ownerEmail?: string;
    googleSheetUrl?: string;
  } | null;
  settings?: {
    commissionRate: number;
    loyaltyThreshold?: number; // Quantidade de compras para ser VIP
  };
  products: Product[];
  stock: StockItem[];
  sales: Sale[];
  orders: Order[];
  expenses: Expense[];
  losses: Loss[]; // Novo campo para perdas
  collaborators: Collaborator[];
  customers: Customer[];
  productions: Production[]; 
}
