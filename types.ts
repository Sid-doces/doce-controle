
export type Category = 'Bolo' | 'Torta' | 'Doce' | 'Outros';

export type PaymentMethod = 'PIX' | 'Dinheiro' | 'Cartão' | 'iFood';

export type OrderStatus = 'Pendente' | 'Entregue';

export interface ProductIngredient {
  stockItemId: string;
  quantity: number; // Quantidade usada na RECEITA COMPLETA
}

export interface Product {
  id: string;
  name: string;
  cost: number; // Custo por UNIDADE (calculado: Custo Total / Yield)
  price: number;
  category: Category;
  quantity: number; // Estoque do produto pronto
  yield: number; // Quanto a receita completa rende (ex: 30 unidades)
  ingredients: ProductIngredient[]; // Vínculo com insumos (Receita Completa)
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  unitPrice: number; // Preço pago por unidade/kg/litro
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  discount: number; // Valor do desconto aplicado
  costUnitary: number; // Custo do produto no momento da venda
  paymentMethod: PaymentMethod;
  date: string;
}

export interface Order {
  id: string;
  clientName: string;
  productName: string;
  deliveryDate: string;
  value: number;
  status: OrderStatus;
}

export interface Expense {
  id: string;
  description: string;
  value: number;
  date: string;
  isFixed: boolean;
}

export interface AppState {
  user: { email: string } | null;
  products: Product[];
  stock: StockItem[];
  sales: Sale[];
  orders: Order[];
  expenses: Expense[];
}
