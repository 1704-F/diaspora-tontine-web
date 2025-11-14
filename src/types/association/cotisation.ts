// src/types/association/cotisation.ts

/**
 * 💰 Statut de paiement d'une cotisation
 */
export type CotisationStatus = 'paid' | 'pending' | 'late' | 'very_late';

/**
 * 💳 Méthode de paiement
 */
export type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'mobile_money' | null;

/**
 * 👤 Membre avec informations de cotisation
 */
export interface CotisationMember {
  id: number;
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string | null;
    profilePicture?: string | null;
  };
  memberType: string;
  section: {
    id: number;
    name: string;
    country: string;
    city: string;
  } | null;
  expectedAmount: number;
  paidAmount: number;
  hasPendingValidation: number;
  paymentMethod: PaymentMethod;
  cotisationStatus: CotisationStatus;
  paymentDate: string | null;
  daysSinceDeadline: number;
  assignedRoles?: string[];
  isAdmin?: boolean;
}

/**
 * 📊 KPIs du dashboard cotisations
 */
export interface CotisationsKPIs {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
  membersCount: number;
  paid: number;
  pending: number;
  late: number;
  very_late: number;
}

/**
 * 📈 Statistiques par section
 */
export interface CotisationsBySectionStats {
  section: {
    id: number | null;
    name: string;
    country: string | null;
    city: string | null;
  };
  membersCount: number;
  expectedAmount: number;
  collectedAmount: number;
  collectionRate: number;
}

/**
 * 📈 Statistiques par type de membre
 */
export interface CotisationsByMemberTypeStats {
  memberType: string;
  membersCount: number;
  expectedAmount: number;
  collectedAmount: number;
  collectionRate: number;
}

/**
 * 📅 Période du dashboard
 */
export interface CotisationPeriod {
  month: number;
  year: number;
  monthName: string;
}

/**
 * 🔍 Filtres du dashboard cotisations
 */
export interface CotisationsFilters {
  month: number;
  year: number;
  sectionId?: number;
  memberType?: string;
  status?: CotisationStatus | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * 📦 Réponse complète du dashboard cotisations
 */
export interface CotisationsDashboardData {
  period: CotisationPeriod;
  kpis: CotisationsKPIs;
  members: CotisationMember[];
  statistics: {
    bySections: CotisationsBySectionStats[];
    byMemberTypes: CotisationsByMemberTypeStats[];
  };
  filters: {
    month: number;
    year: number;
    sectionId: number | null;
    memberType: string | null;
    status: string;
  };
}

/**
 * 📄 Réponse API paginée des cotisations
 */
export interface PaginatedCotisations {
  success: boolean;
  data: CotisationsDashboardData;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * ➕ Payload pour ajout cotisation manuelle
 */
export interface AddManualCotisationPayload {
  memberId: number;
  amount: number;
  month: number;
  year: number;
  reason?: string;
  paymentMethod: PaymentMethod;
}

/**
 * 📜 Historique cotisation d'un membre
 */
export interface MemberCotisationHistory {
  id: number;
  month: number;
  year: number;
  amount: number;
  status: CotisationStatus;
  paymentMethod: PaymentMethod;
  paymentDate: string | null;
  createdAt: string;
  source: 'manual' | 'stripe' | 'bank_transfer' | 'import';
  description?: string;
}

/**
 * 📊 Stats historique membre
 */
export interface MemberCotisationStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  totalPaid: number;
  totalCommissions: number;
  totalNet: number;
}

/**
 * 📦 Réponse historique cotisations membre
 */
export interface MemberCotisationsResponse {
  success: boolean;
  data: {
    cotisations: MemberCotisationHistory[];
    stats: MemberCotisationStats;
    byPeriod: Record<string, {
      year: number;
      month: number;
      cotisations: MemberCotisationHistory[];
      totalAmount: number;
      status: string;
    }>;
  };
}

/**
 * 🎨 Configuration du badge de statut
 */
export interface CotisationStatusConfig {
  variant: 'success' | 'warning' | 'danger' | 'secondary';
  label: string;
  color: string;
}