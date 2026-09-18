/**
 * Server API client. These functions only report success when the server
 * actually confirms the requested operation.
 */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export function connectBlogger(): void {
  window.location.assign("/api/auth/google");
}

async function authHeaders(): Promise<Record<string,string>> {
  try {
    const { getAuth } = await import("firebase/auth");
    const { firebaseApp } = await import("./firebase");
    let user = getAuth(firebaseApp).currentUser;
    if (!user) { const { getWyBlogUser } = await import("./cloud"); user = await getWyBlogUser(); }
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch { return {}; }
}

export async function getConnectionStatus(): Promise<{ connected: boolean }> {
  return request("/api/auth/status");
}

export async function getBillingStatus(): Promise<{ plan: "free" | "pro"; status: string; activeUntil: string | null }> {
  return request("/api/billing/status", { headers: await authHeaders() });
}

export async function verifyProPayment(transactionId: string): Promise<{ plan: "pro" }> {
  return request("/api/billing/verify", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ transactionId }) });
}

export async function getBlogPosts(): Promise<{ posts: unknown[] }> {
  return request("/api/posts");
}

export async function saveBloggerPost(payload: {
  id?: string;
  title: string;
  content: string;
  labels: string[];
  published?: boolean;
}): Promise<{ post?: unknown; url?: string }> {
  return request("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function runDiagnosis(): Promise<{ diagnosis?: unknown }> {
  return request("/api/diagnosis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

export async function startProCheckout(currency: "USD" | "NGN", email: string): Promise<void> {
  const data = await request<{ checkoutUrl?: string }>("/api/billing/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ currency, email }),
  });
  if (!data.checkoutUrl) throw new Error("No checkout URL returned");
  window.location.assign(data.checkoutUrl);
}

export async function saveBackupToDrive(payload: Record<string, unknown>): Promise<{ url?: string }> {
  return request("/api/drive/backup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function uploadMediaToDrive(file: File): Promise<{ url?: string }> {
  const form = new FormData();
  form.append("file", file);
  return request("/api/drive/media", { method: "POST", body: form });
}
