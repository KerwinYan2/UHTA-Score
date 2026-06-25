export type AdminRole = "backend" | "action";

export async function loadAdminSession(): Promise<Record<AdminRole, boolean>> {
  try {
    const response = await fetch("/api/admin/session");
    if (!response.ok) return { backend: false, action: false };
    const data = (await response.json()) as Partial<Record<AdminRole, boolean>>;
    return {
      backend: data.backend === true,
      action: data.action === true,
    };
  } catch {
    return { backend: false, action: false };
  }
}

export async function loginAdmin(role: AdminRole, password: string): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, password }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function authorizeAdminOperation(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/operation", { method: "POST" });
    return response.ok;
  } catch {
    return false;
  }
}
