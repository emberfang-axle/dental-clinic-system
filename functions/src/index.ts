import {setGlobalOptions} from "firebase-functions";
import * as admin from "firebase-admin";

setGlobalOptions({maxInstances: 10});
admin.initializeApp();

export {paymongoWebhook} from "./paymongo";
export {appointmentBookedSms, appointmentSms} from "./sms";
export {appointmentBookedEmail, appointmentEmail, appointmentReminderEmail, announcementEmail} from "./email";
export {calendarCreate, calendarDelete} from "./calendar";
