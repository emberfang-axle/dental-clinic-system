/**
 * Official Estandarte Dental Clinic service catalog.
 * Aligned with thesis documentation (3k_DENTAL-CLINIC-APPPOINTMENT-AND-BILLING-SYSTEM.docx)
 * and seeded to Firestore on first load.
 */

import type { Service } from "./types";

export type ServiceSeed = Omit<Service, "id"> & { requiresDeposit?: boolean };

/** Default clinic services — single source of truth for seed + UI categories */
export const DEFAULT_SERVICES: ServiceSeed[] = [
  { name: "Oral Consultation", price: 300, duration: 20, description: "Initial dental check-up and assessment. Required before most procedures." },
  { name: "Oral Prophylaxis (Cleaning)", price: 700, priceMax: 800, duration: 45, description: "Professional scaling and polishing to remove plaque, tartar, and stains." },
  { name: "Tooth Extraction (Bunot)", price: 700, priceMax: 800, duration: 45, description: "Careful removal of damaged, decayed, or problematic teeth." },
  { name: "Tooth Filling (Pasta)", price: 600, priceMax: 900, duration: 30, description: "Tooth-colored composite resin filling to restore cavities and minor damage." },
  { name: "Orthodontics (Braces)", price: 25000, priceMax: 35000, duration: 90, description: "Full orthodontic treatment with metal or ceramic braces for teeth alignment.", requiresDeposit: true },
  { name: "Braces Adjustment", price: 1000, duration: 30, description: "Routine monthly tightening and wire adjustment for ongoing braces treatment." },
  { name: "Teeth Whitening", price: 3500, priceMax: 5000, duration: 60, description: "In-clinic bleaching treatment to brighten and whiten discolored teeth." },
  { name: "Removable Dentures", price: 8000, duration: 60, description: "Custom-fitted full or partial removable dentures for missing teeth." },
  { name: "Dentures", price: 4500, duration: 60, description: "Standard acrylic dentures to replace missing teeth and restore function." },
  { name: "Ivocap Dentures", price: 15000, duration: 60, description: "Premium heat-cured Ivocap dentures for superior fit, strength, and comfort." },
  { name: "Fixed Bridge", price: 6000, duration: 75, description: "Permanent prosthetic bridge anchored to adjacent teeth to fill gaps." },
  { name: "Crowns and Bridges", price: 9000, duration: 75, description: "Combined crown and bridge restoration for multiple missing or damaged teeth." },
  { name: "Dental Crowns", price: 8000, duration: 60, description: "Full-coverage cap placed over a damaged or weakened tooth to restore shape and strength." },
  { name: "Porcelain Crowns", price: 9000, duration: 60, description: "Natural-looking all-porcelain crowns that blend seamlessly with surrounding teeth." },
  { name: "Zirconia Crowns", price: 12000, duration: 60, description: "High-strength metal-free zirconia crowns for durability and superior aesthetics." },
  { name: "Root Canal Treatment", price: 6500, priceMax: 7000, duration: 90, description: "Endodontic therapy to remove infected pulp and save a severely damaged tooth." },
  { name: "Odontectomy (3rd Molar Removal)", price: 5500, duration: 90, description: "Surgical extraction of impacted or partially erupted wisdom teeth." },
  { name: "Veneers", price: 6500, duration: 90, description: "Thin porcelain or composite shells bonded to the front of teeth for a flawless smile." },
  { name: "Retainers", price: 3500, duration: 30, description: "Custom removable or fixed retainers to maintain teeth position after braces." },
  { name: "Fluoride Application & Sealants", price: 500, duration: 30, description: "Preventive fluoride varnish and pit-and-fissure sealants to protect against decay." },
  { name: "Emergency Dental Services", price: 1000, duration: 30, description: "Immediate care for acute dental pain, trauma, broken teeth, or infections." },
];

export const SERVICE_CATEGORIES: { label: string; names: string[] }[] = [
  {
    label: "Preventive Care",
    names: ["Oral Consultation", "Oral Prophylaxis (Cleaning)", "Teeth Whitening", "Fluoride Application & Sealants"],
  },
  {
    label: "Restorative Treatments",
    names: [
      "Tooth Filling (Pasta)",
      "Root Canal Treatment",
      "Dental Crowns",
      "Porcelain Crowns",
      "Zirconia Crowns",
      "Crowns and Bridges",
      "Fixed Bridge",
      "Veneers",
    ],
  },
  {
    label: "Orthodontics",
    names: ["Orthodontics (Braces)", "Braces Adjustment", "Retainers"],
  },
  {
    label: "Prosthodontics",
    names: ["Dentures", "Removable Dentures", "Ivocap Dentures"],
  },
  {
    label: "Surgical / Emergency",
    names: ["Tooth Extraction (Bunot)", "Odontectomy (3rd Molar Removal)", "Emergency Dental Services"],
  },
];

export function dedupeServices(services: Service[]): Service[] {
  return services.filter(
    (s, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase()) === i,
  );
}

export function categoriseServices(services: Service[]) {
  const unique = dedupeServices(services);
  const categorised = SERVICE_CATEGORIES.map((cat) => ({
    label: cat.label,
    items: unique.filter((s) => cat.names.some((n) => n.toLowerCase() === s.name.toLowerCase())),
  })).filter((c) => c.items.length > 0);

  const known = new Set(SERVICE_CATEGORIES.flatMap((c) => c.names.map((n) => n.toLowerCase())));
  const other = unique.filter((s) => !known.has(s.name.toLowerCase()));
  if (other.length > 0) categorised.push({ label: "Other", items: other });

  return categorised;
}

export function formatServicePrice(s: Service): string {
  const lo = `₱${s.price.toLocaleString("en-PH")}`;
  return s.priceMax ? `${lo} – ₱${s.priceMax.toLocaleString("en-PH")}` : lo;
}

/** Common first-time patient choices — shown at top of booking picker */
export const POPULAR_SERVICE_NAMES = [
  "Oral Consultation",
  "Oral Prophylaxis (Cleaning)",
  "Tooth Filling (Pasta)",
  "Tooth Extraction (Bunot)",
  "Emergency Dental Services",
  "Braces Adjustment",
] as const;

export function isOralConsultation(name: string): boolean {
  return name.trim().toLowerCase() === "oral consultation";
}

export function estimateBookingMinutes(services: Pick<Service, "duration">[]): number {
  return services.reduce((sum, s) => sum + s.duration, 0);
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}
