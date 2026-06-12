import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/hooks/use-auth";
import { useGetProfile } from "@/hooks/use-firestore";

export function getSessionProfileId(): string | null {
  return auth.currentUser?.uid ?? null;
}

export function clearSession(): void {
  signOut(auth);
}

// The signed-in user's identity: Firebase uid + their Pulse profile doc.
// Components use this instead of asking the user to type their name.
export function useSessionProfile() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useGetProfile(user?.uid ?? "");
  return {
    uid: user?.uid ?? null,
    profile: (profile as any) ?? null,
    loading: authLoading || (!!user && profileLoading),
  };
}
