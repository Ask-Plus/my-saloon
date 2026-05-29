import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appointment, Service, Stylist, TimeSlot } from '@/types';

const SEED_SERVICES: Service[] = [
  { id: 's1', name: 'Haircut & Styling', description: 'Professional haircut with blow-dry and styling to enhance your natural beauty.', price: 85, duration: 60, category: 'Hair' },
  { id: 's2', name: 'Hair Coloring', description: 'Full color treatment with premium products for vibrant, long-lasting results.', price: 150, duration: 120, category: 'Hair' },
  { id: 's3', name: 'Balayage & Highlights', description: 'Sun-kissed balayage or dimensional highlights for a gorgeous lived-in look.', price: 200, duration: 150, category: 'Hair' },
  { id: 's4', name: 'Manicure & Nail Art', description: 'Luxurious manicure with hand massage and your choice of nail design or gel polish.', price: 65, duration: 45, category: 'Nails' },
  { id: 's5', name: 'Pedicure Spa', description: 'Relaxing pedicure with foot soak, exfoliation, and hydrating mask treatment.', price: 75, duration: 60, category: 'Nails' },
  { id: 's6', name: 'Facial Treatment', description: 'Deep cleansing facial with extractions, toning, and brightening vitamin C serum.', price: 120, duration: 75, category: 'Skin' },
  { id: 's7', name: 'Eyebrow Shaping', description: 'Precision eyebrow threading or waxing for a perfectly defined arch.', price: 35, duration: 30, category: 'Beauty' },
  { id: 's8', name: 'Eyelash Extensions', description: 'Full set of premium silk lash extensions for dramatic, voluminous lashes.', price: 140, duration: 90, category: 'Beauty' },
];

const SEED_STYLISTS: Stylist[] = [
  { id: 'st1', name: 'Sarah Al-Hassan', title: 'Senior Hair Stylist', specialties: ['Hair Color', 'Balayage', 'Haircuts'], rating: 4.9, reviewCount: 128 },
  { id: 'st2', name: 'Fatima Nour', title: 'Nail & Beauty Artist', specialties: ['Nail Art', 'Manicure', 'Pedicure', 'Lash Extensions'], rating: 4.8, reviewCount: 95 },
  { id: 'st3', name: 'Nora Khalid', title: 'Skin Care Specialist', specialties: ['Facials', 'Eyebrow Shaping', 'Skin Treatments'], rating: 4.7, reviewCount: 74 },
];

function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const today = new Date();
  const stylistIds = ['st1', 'st2', 'st3'];
  const timeRanges = [
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' },
  ];
  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue;
    const dateStr = date.toISOString().split('T')[0];
    stylistIds.forEach((stylistId) => {
      timeRanges.forEach((time, idx) => {
        slots.push({
          id: `slot_${dateStr}_${stylistId}_${idx}`,
          date: dateStr,
          startTime: time.start,
          endTime: time.end,
          stylistId,
          isBooked: false,
        });
      });
    });
  }
  return slots;
}

interface DataContextValue {
  services: Service[];
  stylists: Stylist[];
  timeSlots: TimeSlot[];
  appointments: Appointment[];
  isLoading: boolean;
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addStylist: (stylist: Omit<Stylist, 'id'>) => Promise<void>;
  updateStylist: (stylist: Stylist) => Promise<void>;
  deleteStylist: (id: string) => Promise<void>;
  addTimeSlot: (slot: Omit<TimeSlot, 'id' | 'isBooked'>) => Promise<void>;
  deleteTimeSlot: (id: string) => Promise<void>;
  bookAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

const SERVICES_KEY = '@salon_services';
const STYLISTS_KEY = '@salon_stylists';
const SLOTS_KEY = '@salon_slots';
const APPOINTMENTS_KEY = '@salon_appointments';
const SEEDED_KEY = '@salon_seeded_v2';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const seeded = await AsyncStorage.getItem(SEEDED_KEY);
      if (!seeded) {
        const slots = generateTimeSlots();
        await Promise.all([
          AsyncStorage.setItem(SERVICES_KEY, JSON.stringify(SEED_SERVICES)),
          AsyncStorage.setItem(STYLISTS_KEY, JSON.stringify(SEED_STYLISTS)),
          AsyncStorage.setItem(SLOTS_KEY, JSON.stringify(slots)),
          AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([])),
          AsyncStorage.setItem(SEEDED_KEY, 'true'),
        ]);
        setServices(SEED_SERVICES);
        setStylists(SEED_STYLISTS);
        setTimeSlots(slots);
        setAppointments([]);
      } else {
        const [sv, st, sl, ap] = await Promise.all([
          AsyncStorage.getItem(SERVICES_KEY),
          AsyncStorage.getItem(STYLISTS_KEY),
          AsyncStorage.getItem(SLOTS_KEY),
          AsyncStorage.getItem(APPOINTMENTS_KEY),
        ]);
        if (sv) setServices(JSON.parse(sv));
        if (st) setStylists(JSON.parse(st));
        if (sl) setTimeSlots(JSON.parse(sl));
        if (ap) setAppointments(JSON.parse(ap));
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const addService = useCallback(async (service: Omit<Service, 'id'>) => {
    const newService: Service = { ...service, id: Date.now().toString() };
    const updated = [...services, newService];
    await AsyncStorage.setItem(SERVICES_KEY, JSON.stringify(updated));
    setServices(updated);
  }, [services]);

  const updateService = useCallback(async (service: Service) => {
    const updated = services.map((s) => (s.id === service.id ? service : s));
    await AsyncStorage.setItem(SERVICES_KEY, JSON.stringify(updated));
    setServices(updated);
  }, [services]);

  const deleteService = useCallback(async (id: string) => {
    const updated = services.filter((s) => s.id !== id);
    await AsyncStorage.setItem(SERVICES_KEY, JSON.stringify(updated));
    setServices(updated);
  }, [services]);

  const addStylist = useCallback(async (stylist: Omit<Stylist, 'id'>) => {
    const newStylist: Stylist = { ...stylist, id: Date.now().toString() };
    const updated = [...stylists, newStylist];
    await AsyncStorage.setItem(STYLISTS_KEY, JSON.stringify(updated));
    setStylists(updated);
  }, [stylists]);

  const updateStylist = useCallback(async (stylist: Stylist) => {
    const updated = stylists.map((s) => (s.id === stylist.id ? stylist : s));
    await AsyncStorage.setItem(STYLISTS_KEY, JSON.stringify(updated));
    setStylists(updated);
  }, [stylists]);

  const deleteStylist = useCallback(async (id: string) => {
    const updated = stylists.filter((s) => s.id !== id);
    await AsyncStorage.setItem(STYLISTS_KEY, JSON.stringify(updated));
    setStylists(updated);
  }, [stylists]);

  const addTimeSlot = useCallback(async (slot: Omit<TimeSlot, 'id' | 'isBooked'>) => {
    const newSlot: TimeSlot = { ...slot, id: Date.now().toString(), isBooked: false };
    const updated = [...timeSlots, newSlot];
    await AsyncStorage.setItem(SLOTS_KEY, JSON.stringify(updated));
    setTimeSlots(updated);
  }, [timeSlots]);

  const deleteTimeSlot = useCallback(async (id: string) => {
    const updated = timeSlots.filter((s) => s.id !== id);
    await AsyncStorage.setItem(SLOTS_KEY, JSON.stringify(updated));
    setTimeSlots(updated);
  }, [timeSlots]);

  const bookAppointment = useCallback(async (appt: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newAppt: Appointment = {
      ...appt,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    const updatedSlots = timeSlots.map((s) => s.id === appt.slotId ? { ...s, isBooked: true } : s);
    const updatedAppts = [...appointments, newAppt];
    await Promise.all([
      AsyncStorage.setItem(SLOTS_KEY, JSON.stringify(updatedSlots)),
      AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppts)),
    ]);
    setTimeSlots(updatedSlots);
    setAppointments(updatedAppts);
    return newAppt;
  }, [timeSlots, appointments]);

  const updateAppointmentStatus = useCallback(async (id: string, status: Appointment['status']) => {
    const updated = appointments.map((a) => a.id === id ? { ...a, status } : a);
    await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
    setAppointments(updated);
  }, [appointments]);

  const cancelAppointment = useCallback(async (id: string) => {
    const appt = appointments.find((a) => a.id === id);
    const updatedSlots = appt
      ? timeSlots.map((s) => s.id === appt.slotId ? { ...s, isBooked: false } : s)
      : timeSlots;
    const updatedAppts = appointments.map((a) => a.id === id ? { ...a, status: 'cancelled' as const } : a);
    await Promise.all([
      AsyncStorage.setItem(SLOTS_KEY, JSON.stringify(updatedSlots)),
      AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppts)),
    ]);
    setTimeSlots(updatedSlots);
    setAppointments(updatedAppts);
  }, [appointments, timeSlots]);

  return (
    <DataContext.Provider value={{
      services, stylists, timeSlots, appointments, isLoading,
      addService, updateService, deleteService,
      addStylist, updateStylist, deleteStylist,
      addTimeSlot, deleteTimeSlot,
      bookAppointment, updateAppointmentStatus, cancelAppointment,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
