import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminChrome } from "@/components/admin/AdminChrome";
import { readValidSession } from "@/lib/admin-auth";
import { ensureSeeded } from "@/lib/content/seed";

export const metadata: Metadata = {
  title: "Área dos noivos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await readValidSession())) {
    redirect("/admin/login");
  }

  try {
    await ensureSeeded();
  } catch {
    console.error("[admin] seed");
  }

  return <AdminChrome>{children}</AdminChrome>;
}
