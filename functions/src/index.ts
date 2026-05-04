import {setGlobalOptions} from "firebase-functions";
import * as admin from "firebase-admin";

setGlobalOptions({maxInstances: 10});
admin.initializeApp();

export {paymongoWebhook} from "./paymongo";
export {appointmentSms} from "./sms";
export {appointmentEmail} from "./email";
export {calendarCreate, calendarDelete} from "./calendar";
