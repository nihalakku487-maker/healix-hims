import { Building2, Stethoscope, HeartPulse, ShieldAlert, TestTube, Baby, Brain, Footprints, Pill, Eye, ScanSearch, Syringe } from "lucide-react";

export type Department = {
  id: string;
  name: string;
  iconName: string; // We map this to lucide icons in the UI
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  patients: number;
  experience: string;
  availability: string;
  image: string;
  about: string;
  hospitalId: string;
  departmentId: string;
  queueStatus?: {
    currentToken: number;
    estimatedWaitTime: number; // in mins
    totalInQueue: number;
  };
};

export type Hospital = {
  id: string;
  name: string;
  address: string;
  image: string;
  rating: number;
  isFeatured?: boolean;
};

/* NEW LOCDOC PROVIDER MODELS */
export type PatientQueueItem = {
  id: string;
  name: string;
  tokenNumber: number;
  mode: "clinic" | "online";
  status: "waiting" | "in-progress" | "completed";
  documents: { fileName: string; type: string; date: string }[];
};

export type DoctorQueueState = {
  doctorId: string;
  patients: PatientQueueItem[];
};

export const MOCK_DEPARTMENTS: Department[] = [
  { id: "amb", name: "Ambulance service", iconName: "ambulance" },
  { id: "derm", name: "Dermatology", iconName: "dermatology" },
  { id: "genchk", name: "General check-ups", iconName: "general" },
  { id: "gensurg", name: "General surgery", iconName: "surgery" },
  { id: "lab", name: "Laboratory services", iconName: "lab" },
  { id: "mat", name: "Maternity care", iconName: "maternity" },
  { id: "mental", name: "Mental health care", iconName: "mental" },
  { id: "out", name: "Outpatient services", iconName: "outpatient" },
  { id: "paed", name: "Paediatrics", iconName: "baby" },
  { id: "pharm", name: "Pharmacy services", iconName: "pharmacy" },
  { id: "psych", name: "Psychology", iconName: "brain" },
  { id: "scan", name: "SCANNING", iconName: "scan" },
];

export const MOCK_HOSPITALS: Hospital[] = [
  {
    id: "sastha",
    name: "Sastha Wellness Center",
    address: "10/1163, Ottupara, Kumaranellur, Wadakkanchery, Thrissur, Kerala, 680590",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop",
    rating: 4.9,
    isFeatured: true,
  },
  {
    id: "district",
    name: "District Hospital Wadakkanchery",
    address: "Oottupara, Engakkad P.O., Wadakkanchery",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=2073&auto=format&fit=crop",
    rating: 4.2,
  },
  {
    id: "divine",
    name: "Divine Medical Centre",
    address: "Thrissur-Shoranur Road, Wadakkanchery",
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2128&auto=format&fit=crop",
    rating: 4.5,
  },
];

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: "doc1",
    name: "Dr. Ananya Sharma",
    specialty: "Dermatology",
    rating: 4.8,
    patients: 1200,
    experience: "8 Years",
    availability: "Mon, Wed, Fri",
    image: "/images/doc1.png",
    about: "Dr. Ananya is a highly skilled dermatologist specializing in skin rejuvenation and clinical dermatology.",
    hospitalId: "sastha",
    departmentId: "derm",
    queueStatus: { currentToken: 1, estimatedWaitTime: 5, totalInQueue: 1 }
  },
  {
    id: "doc2",
    name: "Dr. Ramesh Menon",
    specialty: "General surgery",
    rating: 4.9,
    patients: 3400,
    experience: "25 Years",
    availability: "Mon-Sat",
    image: "/images/doc2.png",
    about: "Dr. Menon is a veteran general surgeon with decades of experience in complex abdominal procedures.",
    hospitalId: "sastha",
    departmentId: "gensurg",
    queueStatus: { currentToken: 1, estimatedWaitTime: 10, totalInQueue: 1 }
  },
  {
    id: "doc3",
    name: "Dr. Arjun Nair",
    specialty: "General check-ups & Paediatrics",
    rating: 4.7,
    patients: 2100,
    experience: "5 Years",
    availability: "Daily",
    image: "/images/doc3.png",
    about: "Friendly and highly approachable, Dr. Arjun focuses on foundational pediatric care and family medicine.",
    hospitalId: "sastha",
    departmentId: "genchk",
    queueStatus: { currentToken: 1, estimatedWaitTime: 8, totalInQueue: 1 }
  }
];

export const MOCK_PROVIDER_QUEUES: Record<string, DoctorQueueState> = {
  "doc1": {
    doctorId: "doc1",
    patients: [
      { id: "p1", name: "Sneha V.", tokenNumber: 1, mode: "clinic", status: "waiting", documents: [{ fileName: "Allergy_Report.pdf", type: "PDF", date: "Today" }] }
    ]
  }
};
