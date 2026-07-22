import { JWT, OAuth2Client } from "google-auth-library";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

/**
 * Preferência: OAuth da conta dona da pasta (Gmail pessoal).
 * Alternativa: Service Account só funciona em Shared Drive (Workspace),
 * pois SA não tem cota em My Drive.
 */
export function getDriveFolderId(): string | null {
  return process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || null;
}

export function hasOAuthConfig(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim() &&
      getDriveFolderId()
  );
}

export function hasServiceAccountConfig(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim() &&
      getDriveFolderId()
  );
}

export function isDriveUploadConfigured(): boolean {
  return hasOAuthConfig() || hasServiceAccountConfig();
}

export function getDriveAuthMode(): "oauth" | "service_account" | null {
  if (hasOAuthConfig()) return "oauth";
  if (hasServiceAccountConfig()) return "service_account";
  return null;
}

let cachedOAuth: OAuth2Client | null = null;
let cachedJwt: JWT | null = null;

function getOAuthClient(): OAuth2Client {
  if (cachedOAuth) return cachedOAuth;

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!.trim();
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN!.trim();

  cachedOAuth = new OAuth2Client(clientId, clientSecret);
  cachedOAuth.setCredentials({ refresh_token: refreshToken });
  return cachedOAuth;
}

function getJwtClient(): JWT {
  if (cachedJwt) return cachedJwt;

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(
    /\\n/g,
    "\n"
  );

  cachedJwt = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [DRIVE_SCOPE],
  });
  return cachedJwt;
}

export async function getDriveAccessToken(): Promise<string> {
  const mode = getDriveAuthMode();
  if (!mode) {
    throw new Error("Drive upload não configurado");
  }

  if (mode === "oauth") {
    const client = getOAuthClient();
    const tokenResponse = await client.getAccessToken();
    const token =
      typeof tokenResponse === "string"
        ? tokenResponse
        : tokenResponse?.token;
    if (!token) {
      throw new Error("Não foi possível renovar o token OAuth do Google Drive");
    }
    return token;
  }

  const client = getJwtClient();
  const tokenResponse = await client.getAccessToken();
  const token =
    typeof tokenResponse === "string"
      ? tokenResponse
      : tokenResponse?.token;

  if (!token) {
    throw new Error("Não foi possível obter token da Service Account");
  }

  return token;
}
