import { NextResponse } from "next/server";

const RSVP_URL = process.env.GOOGLE_APPS_SCRIPT_RSVP_URL ?? "";
const RSVP_TIMEOUT_MS = 30_000; // Google Apps Script pode demorar em cold start

// Rate limit: 5 requests per minute per IP (in-memory, resets on server restart)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() ?? realIp ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    return true;
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

function isAllowedOrigin(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const allowedHosts = [
    "localhost",
    "127.0.0.1",
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter(Boolean);

  const url = origin || referer;
  if (!url) return true; // Same-origin or no header (e.g. server-side)

  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return allowedHosts.some(
      (h) => h && (host === h || host.endsWith(`.${h}`))
    );
  } catch {
    return false;
  }
}

function parseGasResponse(text: string) {
  try {
    return JSON.parse(text) as {
      success?: boolean;
      error?: string;
      message?: string;
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!RSVP_URL) {
    return NextResponse.json(
      {
        success: false,
        error: "Confirmação de presença em breve. Volte em alguns dias!",
      },
      { status: 503 }
    );
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        success: false,
        error: "Muitas tentativas. Aguarde um minuto e tente novamente.",
      },
      { status: 429 }
    );
  }

  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Origem não permitida." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { nome, email, nomeAcompanhante, microonibus } = body;

    const trimmedNome = typeof nome === "string" ? nome.trim() : "";
    if (!trimmedNome) {
      return NextResponse.json(
        { success: false, error: "Por favor, informe seu nome completo." },
        { status: 400 }
      );
    }

    const parts = trimmedNome.split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      return NextResponse.json(
        { success: false, error: "Por favor, informe nome e sobrenome." },
        { status: 400 }
      );
    }

    const trimmedEmail = typeof email === "string" ? email.trim() : null;
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { success: false, error: "Informe um e-mail válido." },
          { status: 400 }
        );
      }
    }

    const payload = {
      nome: trimmedNome,
      email: trimmedEmail || null,
      nomeAcompanhante:
        typeof nomeAcompanhante === "string" && nomeAcompanhante.trim()
          ? nomeAcompanhante.trim()
          : null,
      microonibus:
        microonibus === "sim" || microonibus === "nao" ? microonibus : null,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RSVP_TIMEOUT_MS);

    const response = await fetch(RSVP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const text = await response.text();
    const result = parseGasResponse(text);

    if (response.ok && result?.success !== false) {
      return NextResponse.json(result ?? { success: true });
    }

    const errorMessage =
      result?.error ??
      result?.message ??
      (response.status === 403
        ? "Acesso negado. Verifique a configuração do script."
        : response.status >= 500
          ? "O serviço está temporariamente indisponível. Tente novamente em alguns minutos."
          : "Erro ao confirmar. Tente novamente.");

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: response.status >= 400 ? response.status : 502 }
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error:
            "O servidor demorou para responder. Tente novamente em instantes.",
        },
        { status: 504 }
      );
    }
    console.error("[rsvp]", err);
    return NextResponse.json(
      {
        success: false,
        error:
          "Erro de conexão. Verifique sua internet e tente novamente.",
      },
      { status: 500 }
    );
  }
}
