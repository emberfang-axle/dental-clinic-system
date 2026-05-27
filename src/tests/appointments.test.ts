import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../services/firestore", () => ({
  updateDocTyped: vi.fn().mockResolvedValue(undefined),
  addDocTyped: vi.fn().mockResolvedValue("new_id"),
  deleteDocTyped: vi.fn().mockResolvedValue(undefined),
  setDocTyped: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../services/calendar", () => ({
  calendarService: {
    isSlotBlocked: vi.fn().mockReturnValue(false),
    createBookingEvent: vi.fn().mockResolvedValue("cal_event_1"),
  },
}));
vi.mock("../services/notifications", () => ({
  notificationsService: {
    notify: vi.fn().mockResolvedValue(undefined),
    notifyStaff: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("../services/email", () => ({
  emailService: {
    sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
    sendConfirmation: vi.fn().mockResolvedValue(undefined),
    sendCancellation: vi.fn().mockResolvedValue(undefined),
    sendReschedule: vi.fn().mockResolvedValue(undefined),
    sendCompletion: vi.fn().mockResolvedValue(undefined),
    sendPaymentConfirmation: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("../services/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../utils/invoice", () => ({
  downloadInvoice: vi.fn(),
}));

import { setState, resetState } from "../store/store";
import { appointmentsService } from "../services/appointments";
import type { Appointment } from "../shared/types";

const BASE: Appointment = {
  id: "appt_1",
  patientId: "pat_1",
  patientName: "Test Patient",
  serviceId: "svc_1",
  serviceName: "Cleaning",
  price: 700,
  doctor: "Dr. Test",
  date: "2026-05-16",
  time: "09:00",
  status: "confirmed",
  paymentMethod: "cash",
  paymentStatus: "unpaid",
  createdAt: "2026-05-01T00:00:00.000Z",
};

beforeEach(() => {
  resetState();
  setState({ appointments: [{ ...BASE }] });
});

describe("appointmentsService.update", () => {
  it("blocks completing an appointment with no clinical notes", async () => {
    await expect(
      appointmentsService.update("appt_1", { status: "completed" }, "staff"),
    ).rejects.toThrow("no treatment record");
  });

  it("allows completing when diagnosis is present", async () => {
    setState({ appointments: [{ ...BASE, diagnosis: "Caries" }] });
    await expect(
      appointmentsService.update("appt_1", { status: "completed" }, "staff"),
    ).resolves.not.toThrow();
  });

  it("blocks marking paid when appointment is not completed", async () => {
    await expect(
      appointmentsService.update("appt_1", { paymentStatus: "paid" }, "staff"),
    ).rejects.toThrow(/completed first/);
  });

  it("blocks marking paid without treatment notes", async () => {
    setState({ appointments: [{ ...BASE, status: "completed" }] });
    await expect(
      appointmentsService.update("appt_1", { paymentStatus: "paid", paymentMethod: "cash" }, "staff"),
    ).rejects.toThrow(/treatment notes are missing/);
  });

  it("allows marking paid when appointment is completed", async () => {
    setState({ appointments: [{ ...BASE, status: "completed", diagnosis: "Caries" }] });
    await expect(
      appointmentsService.update("appt_1", { paymentStatus: "paid" }, "staff"),
    ).resolves.not.toThrow();
  });

  it("auto-assigns sequential OR number on first paid appointment", async () => {
    setState({ appointments: [{ ...BASE, status: "completed", diagnosis: "Caries" }] });
    await appointmentsService.update("appt_1", { paymentStatus: "paid" }, "staff");
    const { appointments } = (await import("../store/store")).getSnapshot();
    const updated = appointments.find((a) => a.id === "appt_1");
    expect(updated?.receiptNumber).toMatch(/^OR-\d{4}-\d{4}$/);
  });
});

describe("appointmentsService.isSlotTaken", () => {
  it("returns true when the same doctor has a booking at that slot", () => {
    expect(appointmentsService.isSlotTaken("2026-05-16", "09:00", "Dr. Test")).toBe(true);
  });

  it("returns false for a different doctor at the same slot", () => {
    expect(appointmentsService.isSlotTaken("2026-05-16", "09:00", "Dr. Other")).toBe(false);
  });

  it("returns false when the only appointment at that slot is cancelled", () => {
    setState({ appointments: [{ ...BASE, status: "cancelled" }] });
    expect(appointmentsService.isSlotTaken("2026-05-16", "09:00", "Dr. Test")).toBe(false);
  });
});

describe("appointmentsService.cancelAndNotify", () => {
  it("soft-cancels instead of removing the appointment", async () => {
    await appointmentsService.cancelAndNotify("appt_1", "Test Patient");
    const { appointments } = (await import("../store/store")).getSnapshot();
    expect(appointments).toHaveLength(1);
    expect(appointments[0].status).toBe("cancelled");
    expect(appointments[0].cancelledAt).toBeTruthy();
  });
});
