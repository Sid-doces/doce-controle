
export type Category = 'Bolo' | 'Torta' | 'Doce' | 'Outros';
export type PaymentMethod = 'PIX' | 'Dinheiro' | 'Cartão' | 'iFood';
export type OrderStatus = 'Pendente' | 'Entregue';

export interface ProductIngredient {
  stockItemId: string;
  quantity: number; 
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  purchaseCount?: number;
}

export interface Product {
  id: string;
  companyId: string;
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

export interface StockItem {
  id: string;
  companyId: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  unitPrice: number;
}

export interface Loss {
  id: string;
  companyId: string;
  description: string;
  type: 'Insumo' | 'Produto';
  refId: string;
  quantity: number;
  value: number;
  date: string;
}

export interface Sale {
  id: string;
  companyId: string;
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
  customerId?: string;
}

export interface Order {
  id: string;
  companyId: string;
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
  companyId: string;
  description: string;
  value: number;
  date: string;
  isFixed: boolean;
}

export interface AppSettings {
  commissionRate: number;
}

export interface Collaborator {
  id: string;
  companyId: string;
  email: string;
  role: 'Dono' | 'Sócio' | 'Auxiliar' | 'Vendedor';
  addedAt: string;
  commissionRate?: number;
}

// Added name, ownerEmail and googleSheetUrl to UserSession to fix Property '...' does not exist on type 'UserSession' errors.
export interface UserSession {
  userId: string;
  companyId: string;
  email: string;
  role: 'Dono' | 'Sócio' | 'Auxiliar' | 'Vendedor';
  name?: string;
  ownerEmail?: string;
  googleSheetUrl?: string;
}

export interface AppState {
  user: UserSession | null;
  settings?: AppSettings;
  products: Product[];
  stock: StockItem[];
  sales: Sale[];
  orders: Order[];
  expenses: Expense[];
  losses: Loss[];
  collaborators: Collaborator[];
  customers: Customer[];
  productions: any[]; 
}