import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import { auth } from "../../services/firebase";
import { setDocTyped, getDocTyped } from "../../services/firestore";
import type { User } from "../../shared/types";

const ACCOUNTS: Array<{ email: string; password: string; name: string; role: "doctor" | "co-doctor" | "staff"; phone: string }> = [
  {
    email: "drkingestandarte2022@gmail.com",
    password: "doctor123",
    name: "Dr. Mary Cris Estandarte",
    role: "doctor",
    phone: "09107614956",
  },
  {
    email: "kim@estandarte.ph",
    password: "kim123",
    name: "Dr. Kim Precioso",
    role: "co-doctor",
    phone: "09000000001",
  },
  {
    email: "mary@estandarte.ph",
    password: "mary123",
    name: "Dr. Mary Ann Ransas",
    role: "co-doctor",
    phone: "09000000002",
  },
  {
    email: "staff@estandarte.ph",
    password: "Staff2022!",
    name: "Staff",
    role: "staff",
    phone: "09000000003",
  },
];

export function SetupPage({ navigate }: { navigate: (p: string) => void }) {
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function append(msg: string) {
    setLog((prev) => [...prev, msg]);
  }

  async function run() {
    setLoading(true);
    setLog([]);

    for (const acct of ACCOUNTS) {
      try {
        let uid: string;

        try {
          // Try creating fresh
          const cred = await createUserWithEmailAndPassword(auth, acct.email, acct.password);
          uid = cred.user.uid;
          append(`✅ Created: ${acct.email}`);
        } catch (e: any) {
          if (e.code === "auth/email-already-in-use") {
            // Account exists — sign in with current password to get UID,
            // trying common passwords in case it was set differently before.
            const attempts = [acct.password, "staff123", "Estandarte2022!", "Staff2022!", "demo"];
            let signedIn = false;
            for (const pwd of attempts) {
              try {
                const cred = await signInWithEmailAndPassword(auth, acct.email, pwd);
                uid = cred.user.uid;
                // Update to the desired password if it was different
                if (pwd !== acct.password) {
                  await updatePassword(cred.user, acct.password);
                  append(`✅ Password updated: ${acct.email}`);
                } else {
                  append(`✅ Account confirmed: ${acct.email}`);
                }
                signedIn = true;
                break;
              } catch {
                // try next password
              }
            }
            if (!signedIn) {
              append(`❌ Cannot sign in to ${acct.email} — reset the password manually in Firebase Console`);
              continue;
            }
          } else {
            throw e;
          }
        }

        // Upsert Firestore profile
        const existing = await getDocTyped<User>("users", uid!);
        if (!existing) {
          const user: User = { id: uid!, name: acct.name, email: acct.email, role: acct.role, phone: acct.phone, active: true };
          await setDocTyped("users", uid!, user as any);
          append(`✅ Firestore profile created: ${acct.name} (${acct.role})`);
        } else if (existing.role !== acct.role) {
          await setDocTyped("users", uid!, { ...existing, role: acct.role } as any);
          append(`✅ Role corrected to '${acct.role}' for ${acct.email}`);
        } else {
          append(`✅ Firestore profile OK: ${acct.name} (${acct.role})`);
        }
      } catch (err: any) {
        append(`❌ ${acct.email}: ${err.message}`);
      }
    }

    append("— Done. Log in at /#/admin-login —");
    setDone(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-ink-950 text-gold-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full glass-strong rounded-2xl p-8 shadow-luxe space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-gold-shine">Account Setup</h1>
          <p className="text-sm text-gold-100/60 mt-1">Creates or repairs doctor and staff accounts.</p>
        </div>

        <div className="space-y-2">
          {ACCOUNTS.map((a) => (
            <div key={a.email} className="p-3 rounded-lg border border-gold-500/20 bg-ink-900/40 text-sm">
              <div className="font-medium text-gold-100">{a.name} <span className="text-gold-400 text-xs">({a.role})</span></div>
              <div className="text-gold-100/50 text-xs mt-0.5">{a.email}</div>
            </div>
          ))}
        </div>

        <button
          onClick={run}
          disabled={loading || done}
          className="w-full bg-gold-gradient text-ink-950 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition"
        >
          {loading ? "Running..." : done ? "Setup Complete ✓" : "Run Setup"}
        </button>

        {log.length > 0 && (
          <div className="p-4 rounded-lg bg-ink-900/60 border border-gold-500/15 max-h-64 overflow-y-auto space-y-1">
            {log.map((line, i) => (
              <div key={i} className={`text-xs font-mono ${line.startsWith("❌") ? "text-red-400" : "text-gold-100/80"}`}>{line}</div>
            ))}
          </div>
        )}

        <button onClick={() => navigate("/")} className="text-sm text-gold-300 hover:text-gold-100 transition">
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
