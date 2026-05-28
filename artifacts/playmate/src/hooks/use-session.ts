const KEY = "pulse_profile_id";

export function getSessionProfileId(): number | null {
  const v = localStorage.getItem(KEY);
  return v ? Number(v) : null;
}

export function setSessionProfileId(id: number): void {
  localStorage.setItem(KEY, String(id));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}
