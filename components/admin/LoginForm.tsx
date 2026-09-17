"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminFieldClass } from "@/components/admin/field-classes";

const initial: LoginState = null;

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="identifier" className="text-navy">
          Identificador
        </Label>
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          required
          className={adminFieldClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-navy">
          Senha
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={adminFieldClass}
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="h-11 min-h-11 w-full bg-gold text-navy hover:bg-gold/90"
      >
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
