// ── Enums ──────────────────────────────────────────────────────────────────────

export type MaritalStatus   = 'single' | 'married' | 'divorced' | 'widowed' | 'other';
export type UserRole        = 'admin' | 'professional';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'cancelled' | 'completed';
export type BodyPart        = 'right_foot' | 'left_foot' | 'right_hand' | 'left_hand';
export type PaymentMethod   = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'transfer' | 'other';
export type BillingStatus   = 'pending' | 'paid' | 'cancelled' | 'refunded';
export type Perfusion       = 'normal' | 'pale' | 'cyanotic' | 'edematous';
export type PainSensitivity = 'high' | 'moderate' | 'low' | 'none';

// ── Models ─────────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
  dateOfBirth: Date | null;
  maritalStatus: MaritalStatus;
  occupation: string | null;
  cpf: string;
  phoneNumber: string | null;
  email: string | null;
  zipCode: string | null;
  street: string | null;
  addressNumber: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  // optional relations (populated by specific queries)
  _count?: { anamneses: number };
  anamneses?: Anamnesis[];
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  professionalName: string | null;
  role: UserRole;
  professionalId: string | null;
  workdayStart: string;
  workdayEnd: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface Professional {
  id: string;
  adminId: string;
  fullName: string;
  specialty: string | null;
  phoneNumber: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PatientProfessional {
  patientId: string;
  professionalId: string;
  createdAt: Date;
  professional?: Pick<Professional, 'id' | 'fullName' | 'specialty'>;
}

export interface Appointment {
  id: string;
  patientId: string;
  userId: string;
  professionalId: string | null;
  scheduledStart: Date;
  scheduledEnd: Date;
  scheduledDate: Date;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  // optional relations
  patient?: Patient;
  user?: Pick<User, 'id' | 'username' | 'professionalName' | 'role' | 'professionalId' | 'workdayStart' | 'workdayEnd' | 'createdAt'>;
  professional?: Professional | null;
  clinicalEvolutions?: ClinicalEvolution[];
  billings?: Billing[];
}

export interface ClinicalEvolution {
  id: string;
  appointmentId: string;
  clinicalNotes: string | null;
  prescribedMedications: string | null;
  homeCareRecommendations: string | null;
  recommendedReturnDays: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  // optional relation
  evolutionPathologies?: EvolutionPathology[];
}

export interface Pathology {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvolutionPathology {
  evolutionId: string;
  pathologyId: string;
  bodyPart: BodyPart;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  // optional relation
  pathology?: Pathology;
}

export interface Billing {
  id: string;
  appointmentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: BillingStatus;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  // optional relation
  appointment?: Appointment & { patient?: Patient; professional?: Professional | null };
}

export interface Anamnesis {
  id: string;
  patientId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  frequentlyUsedFootwear: string | null;
  frequentlyUsedSocks: string | null;
  practicedSports: string | null;
  hasLowerLimbSurgery: boolean;
  lowerLimbSurgeryDetails: string | null;
  medicationsInUse: string | null;
  isPregnant: boolean;
  hasPacemakerOrPins: boolean;
  hasHypertension: boolean;
  hasSeizures: boolean;
  hasCancerHistory: boolean;
  hasDiabetes: boolean;
  hasCirculatoryProblems: boolean;
  hasHealingProblems: boolean;
  perfusion: Perfusion;
  hasMonofilamentSensitivity: boolean;
  dermatologicalPathologies: string | null;
  nailPathologies: string | null;
  otherObservations: string | null;
  painSensitivity: PainSensitivity | null;
}
