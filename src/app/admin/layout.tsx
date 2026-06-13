import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/ui/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = getAdminSession();

  // No session → render the page as-is (login, invite pages).
  // The middleware already redirects unauthenticated users away from protected
  // routes, so we only reach here for /admin/login and /admin/invite/* without
  // a session. Redirecting here too creates an infinite loop.
  if (!session) return <>{children}</>;

  let name  = "Super Admin";

  if (session.id !== "__super__") {
    const admin = await prisma.adminUser.findUnique({
      where:  { id: session.id },
      select: { name: true },
    }).catch(() => null);

    // Stale / deleted account — return plain children so middleware can redirect
    if (!admin) return <>{children}</>;

    name  = admin.name;
  }

  return (
    <AdminShell name={name} role={session.role}>
      {children}
    </AdminShell>
  );
}
