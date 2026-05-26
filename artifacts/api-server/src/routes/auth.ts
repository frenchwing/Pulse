import { Router } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, otpTable, profilesTable } from "@workspace/db";

const router = Router();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/auth/otp/send", async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^\+?[0-9]{10,13}$/.test(phone.replace(/\s/g, ""))) {
    res.status(400).json({ error: "Valid phone number required" });
    return;
  }
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await db.insert(otpTable).values({ phone, code, expiresAt });
  // In production: send SMS via MSG91/Twilio. In dev mode we return the code directly.
  res.json({ message: "OTP sent", devCode: code });
});

router.post("/auth/otp/verify", async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) { res.status(400).json({ error: "phone and code required" }); return; }
  const now = new Date();
  const [otp] = await db.select().from(otpTable)
    .where(and(eq(otpTable.phone, phone), eq(otpTable.code, code), eq(otpTable.used, false), gt(otpTable.expiresAt, now)));
  if (!otp) { res.status(400).json({ error: "Invalid or expired OTP" }); return; }
  await db.update(otpTable).set({ used: true }).where(eq(otpTable.id, otp.id));
  const [existing] = await db.select().from(profilesTable).where(eq(profilesTable.phone, phone));
  res.json({ verified: true, profileId: existing?.id ?? null, isNewUser: !existing });
});

export default router;
