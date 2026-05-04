import {onRequest} from "firebase-functions/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

const db = admin.firestore();

/**
 * PayMongo webhook — handles link.payment.paid events.
 * Register URL in PayMongo dashboard → Webhooks.
 * Set secret: firebase functions:secrets:set PAYMONGO_WEBHOOK_SECRET
 */
export const paymongoWebhook = onRequest(
  {secrets: ["PAYMONGO_WEBHOOK_SECRET"]},
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed"); return;
    }

    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const sig = req.headers["paymongo-signature"] as string | undefined;
      if (!sig) {
        res.status(401).send("Missing signature"); return;
      }

      const parts = Object.fromEntries(sig.split(",").map((p) => p.split("=")));
      const expected = crypto.createHmac("sha256", webhookSecret)
        .update(`${parts["t"]}.${JSON.stringify(req.body)}`).digest("hex");
      if ((parts["li"] ?? parts["te"]) !== expected) {
        res.status(401).send("Invalid signature"); return;
      }
    }

    if (req.body?.data?.attributes?.type !== "link.payment.paid") {
      res.status(200).send("Ignored"); return;
    }

    const linkId: string | undefined = req.body?.data?.attributes?.data?.id;
    if (!linkId) {
      res.status(400).send("Missing link id"); return;
    }

    const snap = await db.collection("appointments").where("paymongoPaymentIntentId", "==", linkId).limit(1).get();
    if (snap.empty) {
      res.status(200).send("No match"); return;
    }

    await snap.docs[0].ref.update({
      paymentStatus: "paid",
      receiptNumber: `REC-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    });
    res.status(200).send("OK");
  }
);
