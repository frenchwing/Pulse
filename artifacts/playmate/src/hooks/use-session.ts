import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export function getSessionProfileId(): string | null {
  return auth.currentUser?.uid ?? null;
}

export function clearSession(): void {
  signOut(auth);
}
