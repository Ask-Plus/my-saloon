import { db, servicesTable, stylistsTable, timeSlotsTable } from "@workspace/db";
import { logger } from "./logger";

const SEED_SERVICES = [
  { name: "Haircut & Styling", description: "Professional haircut with blow-dry and styling to enhance your natural beauty.", price: 85, duration: 60, category: "Hair" },
  { name: "Hair Coloring", description: "Full color treatment with premium products for vibrant, long-lasting results.", price: 150, duration: 120, category: "Hair" },
  { name: "Balayage & Highlights", description: "Sun-kissed balayage or dimensional highlights for a gorgeous lived-in look.", price: 200, duration: 150, category: "Hair" },
  { name: "Manicure & Nail Art", description: "Luxurious manicure with hand massage and your choice of nail design or gel polish.", price: 65, duration: 45, category: "Nails" },
  { name: "Pedicure Spa", description: "Relaxing pedicure with foot soak, exfoliation, and hydrating mask treatment.", price: 75, duration: 60, category: "Nails" },
  { name: "Facial Treatment", description: "Deep cleansing facial with extractions, toning, and brightening vitamin C serum.", price: 120, duration: 75, category: "Skin" },
  { name: "Eyebrow Shaping", description: "Precision eyebrow threading or waxing for a perfectly defined arch.", price: 35, duration: 30, category: "Beauty" },
  { name: "Eyelash Extensions", description: "Full set of premium silk lash extensions for dramatic, voluminous lashes.", price: 140, duration: 90, category: "Beauty" },
];

const SEED_STYLISTS = [
  { name: "Sarah Al-Hassan", title: "Senior Hair Stylist", specialties: ["Hair Color", "Balayage", "Haircuts"], rating: 4.9, reviewCount: 128 },
  { name: "Fatima Nour", title: "Nail & Beauty Artist", specialties: ["Nail Art", "Manicure", "Pedicure", "Lash Extensions"], rating: 4.8, reviewCount: 95 },
  { name: "Nora Khalid", title: "Skin Care Specialist", specialties: ["Facials", "Eyebrow Shaping", "Skin Treatments"], rating: 4.7, reviewCount: 74 },
];

const TIME_RANGES = [
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "17:00" },
  { start: "17:00", end: "18:00" },
];

export async function seedDatabase(): Promise<void> {
  const [existing] = await db
    .select({ id: servicesTable.id })
    .from(servicesTable)
    .limit(1);

  if (existing) {
    logger.info("Database already seeded, skipping");
    return;
  }

  logger.info("Seeding database...");

  await db.insert(servicesTable).values(SEED_SERVICES);

  const stylists = await db
    .insert(stylistsTable)
    .values(SEED_STYLISTS)
    .returning();

  const today = new Date();
  const slotRows: Array<{ date: string; startTime: string; endTime: string; stylistId: number; isBooked: boolean }> = [];

  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    if (date.getDay() === 0) continue;
    const dateStr = date.toISOString().split("T")[0];
    for (const stylist of stylists) {
      for (const time of TIME_RANGES) {
        slotRows.push({
          date: dateStr,
          startTime: time.start,
          endTime: time.end,
          stylistId: stylist.id,
          isBooked: false,
        });
      }
    }
  }

  await db.insert(timeSlotsTable).values(slotRows);

  logger.info({ services: SEED_SERVICES.length, stylists: stylists.length, slots: slotRows.length }, "Database seeded");
}
