import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/ui/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = getAdminSession();

  // Not authenticated — middleware should have caught this, but belt-and-suspenders
  if (!session) redirect("/admin/login");

  // Resolve admin info without an extra HTTP round-trip
  let name  = "Super Admin";
  let email: string | null = null;

  if (session.id !== "__super__") {
    const admin = await prisma.adminUser.findUnique({
      where:  { id: session.id },
      select: { name: true, email: true },
    }).catch(() => null);

    if (!admin) redirect("/admin/login");
    name  = admin.name;
    email = admin.email;
  }

  return (
    <AdminShell name={name} email={email} role={session.role}>
      {children}
    </AdminShell>
  );
}
