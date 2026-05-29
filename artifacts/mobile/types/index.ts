export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  createdAt: string;
}

export interface Stylist {
  id: number;
  name: string;
  title: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface TimeSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  stylistId: number;
  isBooked: boolean;
  createdAt: string;
}

export interface Appointment {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  serviceId: number;
  serviceName: string;
  servicePrice: number;
  stylistId: number;
  stylistName: string;
  slotId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  role: 'customer' | 'owner';
  businessName?: string | null;
  licenseUrl?: string | null;
  verificationStatus: string;
  createdAt: string;
}

export interface BankAccount {
  id: number;
  ownerId: number;
  bankName: string;
  accountName: string;
  iban: string;
  createdAt: string;
}
