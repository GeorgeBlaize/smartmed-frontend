/** Shapes returned by the SmartMed API (mirrors the Prisma models on the backend). */

export type Role = "PATIENT" | "CAREGIVER" | "ADMIN" | "DOCTOR" | "PHARMACY";
export type PrescriptionSource = "UPLOAD" | "DOCTOR" | "PHARMACY";
export type Plan = "FREE" | "PREMIUM";
export type Language = "bn" | "en";
export type MealTiming = "BEFORE_MEAL" | "AFTER_MEAL" | "WITH_MEAL" | "ANY";
export type DoseStatus = "PENDING" | "TAKEN" | "MISSED" | "SKIPPED";
export type PrescriptionStatus = "PROCESSING" | "PROCESSED" | "VERIFIED" | "FAILED";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
  isEmailVerified: boolean;
  avatarUrl: string | null;
  language: Language;
  largeFont: boolean;
  voiceEnabled: boolean;
  timezone: string;
  honorific: string | null;
  dateOfBirth: string | null;
  gender: "male" | "female" | "other" | null;
  bloodGroup: string | null;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: string | null;
  smsEnabled: boolean;
  callEnabled: boolean;
  organization: string | null;
  licenseNumber: string | null;
  specialty: string | null;
  address: string | null;
  isProVerified: boolean;
  plan: Plan;
  planExpiresAt: string | null;
  shareToken: string | null;
  shareExpiresAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Reminder {
  id: string;
  medicineId: string;
  time: string;
  daysOfWeek: number[];
  quantity: string;
  isActive: boolean;
}

export interface Medicine {
  id: string;
  patientId: string;
  prescriptionId: string | null;
  name: string;
  genericName: string | null;
  strength: string | null;
  form: string | null;
  dosagePattern: string | null;
  instructions: string | null;
  instructionsBn: string | null;
  mealTiming: MealTiming;
  durationDays: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  reminders: Reminder[];
  prescription?: { id: string; title: string | null; doctorName: string | null } | null;
}

export interface Prescription {
  id: string;
  patientId: string;
  imageUrl: string | null;
  source: PrescriptionSource;
  title: string | null;
  doctorName: string | null;
  hospital: string | null;
  prescribedDate: string | null;
  diagnosis: string | null;
  advice: string | null;
  notes: string | null;
  rawText: string | null;
  aiSummaryBn: string | null;
  aiConfidence: number | null;
  status: PrescriptionStatus;
  failureReason: string | null;
  createdAt: string;
  medicines: Medicine[];
  patient?: { id: string; name: string; email: string };
}

export interface Dose {
  id: string;
  reminderId: string;
  medicineId: string;
  patientId: string;
  scheduledFor: string;
  status: DoseStatus;
  takenAt: string | null;
  medicine: Pick<Medicine, "id" | "name" | "strength" | "form" | "mealTiming" | "instructions" | "instructionsBn">;
  reminder: { id: string; time: string; quantity: string };
}

export interface DoseSummary {
  total: number;
  taken: number;
  missed: number;
  skipped: number;
  pending: number;
}

export interface TodaySchedule {
  date: string;
  timeZone: string;
  summary: DoseSummary;
  nextDoseId: string | null;
  doses: Dose[];
}

export interface AdherenceStats {
  days: number;
  timeZone: string;
  totals: DoseSummary;
  adherenceRate: number | null;
  streakDays: number;
  daily: { date: string; taken: number; missed: number; skipped: number; pending: number }[];
  byMedicine: { medicineId: string; name: string; taken: number; total: number; rate: number | null }[];
  byTimeOfDay: { slot: string; taken: number; total: number; rate: number | null }[];
}

export type InventoryState = "OK" | "EXPIRING" | "EXPIRED" | "DISPOSED";

export interface InventoryItem {
  id: string;
  name: string;
  batchNumber: string | null;
  manufactureDate: string | null;
  expiryDate: string;
  quantity: number | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  notes: string | null;
  isDisposed: boolean;
  daysLeft: number;
  state: InventoryState;
}

export interface PatientDashboard {
  today: TodaySchedule;
  weekly: Pick<AdherenceStats, "adherenceRate" | "streakDays" | "daily" | "totals">;
  counts: { activeMedicines: number; prescriptions: number; expiringItems: number; unreadNotifications: number };
  expiringItems: Omit<InventoryItem, "daysLeft" | "state">[];
}

export interface Person {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
}

export interface CareLink {
  id: string;
  patientId: string;
  caregiverId: string | null;
  inviteEmail: string;
  relation: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "REVOKED";
  createdAt: string;
  respondedAt: string | null;
  caregiver?: Person | null;
  patient?: Person;
}

export interface CaredPatient {
  linkId: string;
  relation: string | null;
  patient: Person & { timezone: string; dateOfBirth: string | null; bloodGroup: string | null; chronicConditions: string[] };
  today: DoseSummary;
  nextDose: Dose | null;
  missedToday: { id: string; medicine: string; time: string }[];
}

export interface PatientOverview {
  patient: Pick<User, "id" | "name" | "email" | "phone" | "avatarUrl" | "dateOfBirth" | "bloodGroup" | "allergies" | "chronicConditions" | "emergencyContact" | "smsEnabled" | "callEnabled">;
  today: TodaySchedule;
  weekly: AdherenceStats;
  medicines: Medicine[];
  expiringItems: InventoryItem[];
}

export interface AppNotification {
  id: string;
  type: "DOSE_REMINDER" | "MISSED_DOSE" | "EXPIRY_ALERT" | "CARE_INVITE" | "PAYMENT" | "SYSTEM";
  title: string;
  message: string;
  speakText: string | null;
  data: Record<string, string> | null;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface MedicineInfo {
  name: string;
  genericName: string | null;
  category: string | null;
  summary: string;
  uses: string[];
  howToTake: string | null;
  sideEffects: string[];
  seriousWarnings: string[];
  avoid: string[];
  storage: string | null;
  isKnownMedicine: boolean;
  cached: boolean;
}

export interface InteractionReport {
  checkedMedicines: string[];
  overallRisk: "LOW" | "MODERATE" | "HIGH" | "UNKNOWN";
  summary: string;
  interactions: { medicines: string[]; severity: "MINOR" | "MODERATE" | "MAJOR"; description: string; recommendation: string }[];
  allergyWarnings: string[];
  duplicateTherapy: string[];
  generalAdvice: string[];
}

export interface AdherenceInsight {
  stats: { adherenceRate: number | null; streakDays: number; totals: DoseSummary };
  headline: string;
  riskLevel: "GOOD" | "FAIR" | "POOR";
  insights: string[];
  tips: string[];
  caregiverNote: string | null;
}

export interface StripScanResult {
  isMedicine: boolean;
  name: string | null;
  genericName: string | null;
  strength: string | null;
  batchNumber: string | null;
  manufactureDate: string | null;
  expiryDate: string | null;
  confidence: number;
  imageUrl: string;
  imagePublicId: string;
}

export interface Payment {
  id: string;
  tranId: string;
  amount: string;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  plan: Plan;
  months: number;
  cardType: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface PlansResponse {
  enabled: boolean;
  currency: string;
  plans: { months: number; label: string; discount: number; price: number }[];
  features: string[];
}

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

/** A prescription written by a doctor or scanned by a pharmacy, handed to a patient via QR code. */
export interface IssuedItem {
  name: string;
  genericName?: string | null;
  strength?: string | null;
  form?: string | null;
  dosagePattern?: string | null;
  instructions?: string | null;
  instructionsBn?: string | null;
  mealTiming: MealTiming;
  durationDays?: number | null;
  reminders: { time: string; quantity: string; daysOfWeek: number[]; isActive?: boolean }[];
}

export interface IssuedPrescription {
  id: string;
  code: string;
  claimUrl: string;
  source: "DOCTOR" | "PHARMACY";
  patientName: string;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | null;
  patientPhone: string | null;
  diagnosis: string | null;
  advice: string | null;
  followUpDate: string | null;
  imageUrl: string | null;
  items: IssuedItem[];
  claimedAt: string | null;
  claimedBy?: { id: string; name: string } | null;
  expiresAt: string;
  createdAt: string;
  issuer?: { id: string; name: string; organization: string | null; specialty: string | null; licenseNumber: string | null; isProVerified: boolean };
}

export interface ClaimPreview {
  code: string;
  source: "DOCTOR" | "PHARMACY";
  issuer: { name: string; organization: string | null; specialty: string | null; licenseNumber: string | null; isProVerified: boolean };
  patientName: string;
  patientAge: number | null;
  patientGender: string | null;
  diagnosis: string | null;
  advice: string | null;
  followUpDate: string | null;
  imageUrl: string | null;
  items: IssuedItem[];
  createdAt: string;
  expiresAt: string;
  claimed: boolean;
  expired: boolean;
}
