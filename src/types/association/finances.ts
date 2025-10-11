// src/types/association/finances.ts

/**
 * 💸 Demande de dépense
 */
export interface ExpenseRequest {
  id: number;
  associationId: number;
  requesterId: number; // ID du membre qui demande
  
  // 💰 Montant & détails
  amount: number;
  currency: string;
  description: string;
  category: ExpenseCategory;
  
  // 📎 Justificatifs
  attachments?: string[]; // URLs documents
  
  // ✅ Workflow approbation
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: number; // ID membre qui a validé
  approvedAt?: string; // ISO date
  rejectionReason?: string;
  
  // 💳 Paiement
  paidAt?: string; // ISO date
  paymentMethod?: 'cash' | 'transfer' | 'card';
  paymentReference?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // 👤 Relations (si populate)
  requester?: {
    id: number;
    name: string;
    memberType: string;
  };
  
  approver?: {
    id: number;
    name: string;
  };
}

/**
 * 📊 Catégories de dépenses
 */
export type ExpenseCategory = 
  | 'solidarity' // Aide solidarité
  | 'event' // Événement
  | 'administration' // Frais administratifs
  | 'communication' // Communication
  | 'other'; // Autre

/**
 * 💵 Entrée de revenu (cotisation, don)
 */
export interface IncomeEntry {
  id: number;
  associationId: number;
  memberId?: number; // Si cotisation membre
  
  // 💰 Montant & détails
  amount: number;
  currency: string;
  description: string;
  category: IncomeCategory;
  
  // 💳 Paiement
  paymentMethod: 'cash' | 'transfer' | 'card' | 'mobile_money';
  paymentReference?: string;
  receivedAt: string; // ISO date
  
  // 📎 Justificatifs
  receiptUrl?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // 👤 Relations (si populate)
  member?: {
    id: number;
    name: string;
  };
}

/**
 * 📊 Catégories de revenus
 */
export type IncomeCategory = 
  | 'cotisation' // Cotisation membre
  | 'donation' // Don
  | 'fundraising' // Levée de fonds
  | 'sponsorship' // Parrainage
  | 'other'; // Autre

/**
 * 💰 Résumé financier
 */
export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  pendingExpenses: number;
  
  // 📊 Par période
  currentMonth: {
    income: number;
    expenses: number;
    balance: number;
  };
  
  currentYear: {
    income: number;
    expenses: number;
    balance: number;
  };
  
  // 📈 Top catégories
  topExpenseCategories: Array<{
    category: ExpenseCategory;
    total: number;
    count: number;
  }>;
  
  topIncomeCategories: Array<{
    category: IncomeCategory;
    total: number;
    count: number;
  }>;
}

/**
 * 📦 Réponse API GET /finances
 */
export interface GetFinancesResponse {
  success: boolean;
  data: {
    summary: FinancialSummary;
    recentExpenses: ExpenseRequest[];
    recentIncome: IncomeEntry[];
  };
}

/**
 * 📦 Réponse API GET /finances/expenses
 */
export interface GetExpensesResponse {
  success: boolean;
  data: {
    expenses: ExpenseRequest[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

/**
 * 📦 Réponse API GET /finances/income
 */
export interface GetIncomeResponse {
  success: boolean;
  data: {
    income: IncomeEntry[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

/**
 * 📝 Payload création demande dépense
 */
export interface CreateExpensePayload {
  amount: number;
  description: string;
  category: ExpenseCategory;
  attachments?: string[]; // URLs ou base64
}

/**
 * 📝 Payload validation dépense
 */
export interface ApproveExpensePayload {
  approvedBy: number; // ID membre validateur
  paymentMethod?: 'cash' | 'transfer' | 'card';
  paymentReference?: string;
}

export interface RejectExpensePayload {
  rejectionReason: string;
}

/**
 * 📝 Payload création revenu
 */
export interface CreateIncomePayload {
  amount: number;
  description: string;
  category: IncomeCategory;
  memberId?: number; // Si cotisation
  paymentMethod: 'cash' | 'transfer' | 'card' | 'mobile_money';
  paymentReference?: string;
  receivedAt?: string; // ISO date, défaut = now
}

/**
 * 🔍 Filtres finances
 */
export interface FinanceFilters {
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  categories?: (ExpenseCategory | IncomeCategory)[];
  status?: ExpenseRequest['status'][];
  memberId?: number; // Filtrer par membre
  minAmount?: number;
  maxAmount?: number;
}

/**
 * 📊 Options tri finances
 */
export interface FinanceSortOptions {
  field: 'amount' | 'createdAt' | 'status' | 'category';
  direction: 'asc' | 'desc';
}

/**
 * 📈 Rapport financier (export)
 */
export interface FinancialReport {
  associationId: number;
  associationName: string;
  period: {
    start: string; // ISO date
    end: string; // ISO date
  };
  
  summary: {
    openingBalance: number;
    totalIncome: number;
    totalExpenses: number;
    closingBalance: number;
  };
  
  expenses: ExpenseRequest[];
  income: IncomeEntry[];
  
  // 📊 Graphiques
  expensesByCategory: Record<ExpenseCategory, number>;
  incomeByCategory: Record<IncomeCategory, number>;
  monthlyTrend: Array<{
    month: string; // "2025-01"
    income: number;
    expenses: number;
    balance: number;
  }>;
  
  generatedAt: string; // ISO date
  generatedBy: number; // userId
}

/**
 * 💳 Configuration paiements PSP
 */
export interface PaymentProviderConfig {
  provider: 'stripe' | 'square' | 'flutterwave';
  enabled: boolean;
  publicKey?: string;
  currency: string;
  commissionRate: number; // %
}

/**
 * 🔔 Notification finance (webhook)
 */
export interface FinanceNotification {
  type: 'expense_created' | 'expense_approved' | 'expense_rejected' | 'income_received';
  associationId: number;
  amount: number;
  description: string;
  triggeredBy: number; // userId
  triggeredAt: string; // ISO date
}