import {setGlobalOptions} from "firebase-functions";
import * as admin from "firebase-admin";

setGlobalOptions({maxInstances: 10});
admin.initializeApp();

export {calendarCreate, calendarDelete} from "./calendar";
export {sendEmail} from "./email";

import {onCall, HttpsError} from "firebase-functions/v2/https";

/**
 * Callable: delete a Firebase Auth user by UID.
 * Only callable by authenticated doctors/admins.
 */
export const deleteAuthUser = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");

  const callerDoc = await admin.firestore().collection("users").doc(request.auth.uid).get();
  const role = callerDoc.data()?.role;
  if (role !== "doctor" && role !== "admin") {
    throw new HttpsError("permission-denied", "Only doctors or admins can delete accounts.");
  }

  const { uid } = request.data as { uid: string };
  if (!uid) throw new HttpsError("invalid-argument", "uid is required.");
  if (uid === request.auth.uid) throw new HttpsError("invalid-argument", "Cannot delete your own account.");

  await admin.auth().deleteUser(uid);
  await admin.firestore().collection("users").doc(uid).delete();
  return { success: true };
});
