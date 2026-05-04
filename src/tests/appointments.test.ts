import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock external dependencies ──────────────────────────────────────────────
vi.mock("../services/firestore", () => ({
  updateDocTyped: vi.fn().mockResolvedValue(undefined),
  addDocTyped:    vi.fn().mockResolvedValue("new_id"),
  deleteDocTyped: vi.fn().mockResolvedValue(undefined),
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

// ── Seed store before each test ──────────────────────────────────────────────
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

// ── Tests ────────────────────────────────────────────────────────────────────

describe("appointmentsService.update", () => {
  it("blocks completing an appointment with no clinical notes", async () => {
    await expect(
      appointmentsService.update("appt_1", { status: "completed" }, "staff")
    ).rejects.toThrow("no treatment record");
  });

  it("allows completing when diagnosis is present", async () => {
    setState({ appointments: [{ ...BASE, diagnosis: "Caries" }] });
    await expect(
      appointmentsService.update("appt_1", { status: "completed" }, "staff")
    ).resolves.not.toThrow();
  });

  it("blocks marking paid when appointment is not completed", async () => {
    await expect(
      appointmentsService.update("appt_1", { paymentStatus: "paid" }, "staff")
    ).rejects.toThrow("must be completed first");
  });

  it("allows marking paid when appointment is completed", async () => {
    setState({ appointments: [{ ...BASE, status: "completed", diagnosis: "Caries" }] });
    await expect(
      appointmentsService.update("appt_1", { paymentStatus: "paid" }, "staff")
    ).resolves.not.toThrow();
  });

  it("auto-assigns sequential OR number on first paid appointment", async () => {
    setState({ appointments: [{ ...BASE, status: "completed", diagnosis: "Caries" }] });
    await appointmentsService.update("appt_1", { paymentStatus: "paid" }, "staff");
    const { appointments } = (await import("../store/store")).getSnapshot();
    const updated = appointments.find((a) => a.id === "appt_1");
    expect(updated?.receiptNumber).toMatch(/^OR-\d{4}-\d{4}$/);
  });

  it("increments OR number sequentially", async () => {
    const year = new Date().getFullYear();
    setState({
      appointments: [
        { ...BASE, id: "appt_1", status: "completed", diagnosis: "Caries", receiptNumber: `OR-${year}-0001` },
        { ...BASE, id: "appt_2", status: "completed", diagnosis: "Caries" },
      ],
    });
    await appointmentsService.update("appt_2", { paymentStatus: "paid" }, "staff");
    const { appointments } = (await import("../store/store")).getSnapshot();
    const updated = appointments.find((a) => a.id === "appt_2");
    expect(updated?.receiptNumber).toBe(`OR-${year}-0002`);
  });
});

describe("appointmentsService.isSlotTaken", () => {
  it("returns true when a non-cancelled appointment exists at that slot", () => {
    expect(appointmentsService.isSlotTaken("2026-05-16", "09:00")).toBe(true);
  });

  it("returns false for a different date", () => {
    expect(appointmentsService.isSlotTaken("2026-05-17", "09:00")).toBe(false);
  });

  it("returns false for a different time", () => {
    expect(appointmentsService.isSlotTaken("2026-05-16", "10:00")).toBe(false);
  });

  it("returns false when the only appointment at that slot is cancelled", () => {
    setState({ appointments: [{ ...BASE, status: "cancelled" }] });
    expect(appointmentsService.isSlotTaken("2026-05-16", "09:00")).toBe(false);
  });
});
