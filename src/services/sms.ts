const KEY = import.meta.env.VITE_SEMAPHORE_API_KEY as string | undefined;
const URL = "https://api.semaphore.co/api/v4/messages";

async function send(to: string, message: string) {
  if (!KEY) return;
  await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey: KEY, number: to, message, sendername: "ESTANDARTE" }),
  });
}

export const smsService = {
  booked: (to: string, name: string, service: string, date: string, time: string) =>
    send(to, `Hi ${name}! Your request for ${service} on ${date} at ${time} has been received and is pending confirmation. - Estandarte Dental`),

  confirmed: (to: string, name: string, service: string, date: string, time: string) =>
    send(to, `Hi ${name}! Your ${service} appointment on ${date} at ${time} is CONFIRMED. Please arrive 10 mins early. - Estandarte Dental`),

  completed: (to: string, name: string, service: string) =>
    send(to, `Hi ${name}! Your ${service} appointment is done. Thank you for visiting Estandarte Dental Clinic!`),

  cancelled: (to: string, name: string, service: string, date: string, time: string) =>
    send(to, `Hi ${name}! Your ${service} appointment on ${date} at ${time} has been cancelled. To rebook, visit our website or contact the clinic. - Estandarte Dental`),

  rescheduled: (to: string, name: string, service: string, date: string, time: string) =>
    send(to, `Hi ${name}! Your ${service} appointment has been rescheduled to ${date} at ${time}. Please arrive 10 mins early. - Estandarte Dental`),

  paid: (to: string, name: string, service: string, price: number, receipt?: string) =>
    send(to, `Hi ${name}! Payment of PHP ${price} for ${service} confirmed. Receipt: ${receipt ?? "—"}. Thank you! - Estandarte Dental`),
};
