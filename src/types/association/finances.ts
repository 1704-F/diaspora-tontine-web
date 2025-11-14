// src/types/association/finance.ts

/**
 * 💰 Types pour le module Finances
 */

// ============================================
// TYPES DE BASE
// ============================================

export type ExpenseType = 
  | 'aide_membre'
  | 'depense_operationnelle'
  | 'pret_partenariat'
  | 'projet_special'
  | 'urgence_communautaire';

export type ExpenseStatus =
  | 'pending'
  | 'under_review'
  | 'additional_info_needed'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'cancelled';

export type UrgencyLevel = 'low' | 'normal' | 'high' | 'critical';

export type PaymentMethod =
  | 'bank_transfer'
  | 'card_payment'
  | 'cash'
  | 'check'
  | 'mobile_money';

export type PaymentMode = 'digital' | 'manual';

// ============================================
// INTERFACES PRINCIPALES
// ============================================

export interface ExpenseRequest {
  id: number;
  associationId: number;
  requesterId: number;
  expenseType: ExpenseType;
  expenseSubtype?: string;
  title: string;
  description: string;
  amountRequested: number;
  amountApproved?: number;
  currency: string;
  urgencyLevel: UrgencyLevel;
  status: ExpenseStatus;
  beneficiaryId?: number;
  beneficiaryExternal?: {
    name: string;
    contact?: string;
    organization?: string;
  };
  isLoan: boolean;
  loanTerms?: {
    durationMonths: number;
    interestRate: number;
    repaymentSchedule: string;
  };
  documents?: string[];
  validationHistory?: ValidationEntry[];
  approvedAt?: string;
  approvedBy?: number;
  rejectedAt?: string;
  rejectedBy?: number;
  paidAt?: string;
  transactionId?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;

  expectedImpact?: string;
  actualImpact?: string;
  rejectionReason?: string;
  
  // Relations
  requester?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  beneficiary?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface ValidationEntry {
  userId: number;
  role: string;
  decision: 'approved' | 'rejected' | 'info_requested';
  comment: string;
  timestamp: string;
}

export interface FinancialSummary {
  association: {
    id: number;
    name: string;
    currency: string;
  };
  balance: {
    current: number;
    projected: number;
    available: number;
  };
  expenses: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
    byType: Array<{
      type: ExpenseType;
      count: number;
      total: number;
    }>;
  };
  income: {
    total: number;
    cotisations: number;
    donations: number;
    other: number;
  };
  loans: {
    active: number;
    totalDisbursed: number;
    totalRepaid: number;
    outstanding: number;
  };
  alerts?: Array<{
    type: string;
    severity: 'info' | 'warning' | 'danger';
    message: string;
  }>;
}

// ============================================
// PAYLOADS API
// ============================================

export interface CreateExpensePayload {
  expenseType: ExpenseType;
  expenseSubtype?: string;
  title: string;
  description: string;
  amountRequested: number;
  currency?: string;
  urgencyLevel?: UrgencyLevel;
  beneficiaryId?: number;
  beneficiaryExternal?: {
    name: string;
    contact?: string;
    organization?: string;
  };
  isLoan?: boolean;
  loanTerms?: {
    durationMonths: number;
    interestRate: number;
    repaymentSchedule: string;
  };
  documents?: string[];
  externalReferences?: Record<string, unknown>;
  expectedImpact?: string;
  metadata?: Record<string, unknown>;
}

export interface ApproveExpensePayload {
  comment?: string;
  amountApproved?: number;
  conditions?: string;
}

export interface RejectExpensePayload {
  rejectionReason: string;
}

export interface ProcessPaymentPayload {
  paymentMode: PaymentMode;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  manualPaymentReference?: string;
  manualPaymentDetails?: Record<string, unknown>;
  notes?: string;
}

// ============================================
// FILTRES & PAGINATION
// ============================================

export interface ExpenseFilters {
  status?: ExpenseStatus;
  expenseType?: ExpenseType;
  urgencyLevel?: UrgencyLevel;
  requesterId?: number;
  beneficiaryId?: number;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  isLoan?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'amountRequested' | 'urgencyLevel' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedExpenses {
  expenses: ExpenseRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    totalPages: number;
  };
  summary?: {
    totalAmount: number;
    averageAmount: number;
    statusCounts: Record<ExpenseStatus, number>;
  };
}

// ============================================
// RÉPONSES API
// ============================================

export interface GetExpensesResponse {
  success: boolean;
  data: PaginatedExpenses;
}

export interface GetExpenseByIdResponse {
  success: boolean;
  data: {
    expense: ExpenseRequest;
  };
}

export interface CreateExpenseResponse {
  success: boolean;
  message: string;
  data: {
    expense: ExpenseRequest;
  };
}

export interface ApproveExpenseResponse {
  success: boolean;
  message: string;
}

export interface RejectExpenseResponse {
  success: boolean;
  message: string;
}

export interface GetFinancialSummaryResponse {
  success: boolean;
  data: FinancialSummary;
}

// ============================================
// TYPES HELPERS
// ============================================

export interface ExpenseTypeConfig {
  id: ExpenseType;
  label: string;
  icon: string;
  color: string;
  description?: string;
}

export interface ExpenseStatusConfig {
  id: ExpenseStatus;
  label: string;
  variant: 'default' | 'secondary' | 'success' | 'warning' | 'danger';
  icon?: string;
}