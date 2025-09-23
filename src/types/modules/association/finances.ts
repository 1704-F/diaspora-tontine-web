// types/finances.ts

export interface Association {
  id: number;
  name: string;
  description?: string;
  type: string;
  status: string;
  workflowRules?: Record<string, any>;
  expenseTypes?: Record<string, any>;
  permissionsMatrix?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles?: string[];
}

export interface ExpenseRequest {
  id: number;
  title: string;
  description: string;
  expenseType: string;
  expenseSubtype?: string;
  amountRequested: number;
  amountApproved?: number;
  currency: string;
  status: 'pending' | 'under_review' | 'additional_info_needed' | 'approved' | 'paid' | 'rejected';
  urgencyLevel: 'low' | 'normal' | 'high' | 'critical';
  isLoan: boolean;
  paymentMode?: 'digital' | 'manual';
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  requester: User;
  beneficiary?: User;
  validationProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  loanTerms?: {
    duration: number;
    interestRate: number;
    installments: number;
  };
  requiredValidators?: string[];
  validationHistory?: Array<{
    userId: number;
    role: string;
    decision: 'approved' | 'rejected' | 'info_requested';
    comment?: string;
    timestamp: string;
  }>;
}

export interface FinancialBalance {
  totalIncome: number;
  totalExpenses: number;
  outstandingLoans: number;
  availableBalance: number;
}

export interface FinancialSummary {
  association: {
    id: number;
    name: string;
    country: string;
    currency: string;
    sectionsCount: number;
  };
  balance: {
    current: FinancialBalance;
    projected: number;
    lastCalculated: string;
  };
  cashFlow: {
    totalIncome: number;
    totalExpenses: number;
    outstandingLoans: number;
    pendingExpenses: number;
    upcomingRepayments: number;
  };
  expenses: {
    byType: Array<{
      type: string;
      count: number;
      total: number;
    }>;
    period: string;
  };
  membership: {
    total: number;
    byType: Array<{ type: string; count: number; }>;
    byStatus: Array<{ status: string; count: number; }>;
  };
  cotisations: {
    period: string;
    count: number;
    totalGross: number;
    totalNet: number;
    totalCommissions: number;
  };
  upcoming: {
    upcomingRepayments: Array<any>;
    urgentExpenses: Array<any>;
    lateContributions: Array<any>;
  };
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    value: number;
  }>;
  metadata: {
    period: string;
    includeProjections: boolean;
    generatedAt: string;
    userRole: string[];
    hasFullAccess: boolean;
    accessLevel: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour les endpoints API
export interface ExpenseRequestsResponse {
  expenseRequests: ExpenseRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FinancialSummaryResponse {
  summary: FinancialSummary;
}