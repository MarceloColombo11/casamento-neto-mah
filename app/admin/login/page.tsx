import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { readValidSession } from "@/lib/admin-auth";
import Monograma from "@/components/monograma";

export const metadata: Metadata = {
  title: "Área dos noivos",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await readValidSession()) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#f7f4ef] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Monograma
            animate={false}
            ariaHidden
            className="mx-auto h-24 w-24 text-navy"
          />
          <h1 className="mt-6 font-heading text-3xl font-semibold text-navy">
            Área dos noivos
          </h1>
          <p className="mt-2 text-sm text-navy/70">
            Entre para cuidar das fotos, dos textos e da lista de presentes.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
