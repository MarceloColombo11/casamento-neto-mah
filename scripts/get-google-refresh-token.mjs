/**
 * One-time helper: gera GOOGLE_OAUTH_REFRESH_TOKEN para upload no Drive pessoal.
 *
 * Pré-requisitos:
 * 1. Google Cloud Console → APIs & Services → Enable "Google Drive API"
 * 2. Credentials → Create OAuth client ID → Application type: "Desktop app"
 * 3. Copie Client ID e Client Secret
 *
 * Uso:
 *   GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... npm run drive:oauth
 *
 * Depois cole o refresh_token no .env.local (e na Vercel).
 */

import { createServer } from "node:http";
import { OAuth2Client } from "google-auth-library";
import open from "open";

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const REDIRECT_PORT = 53682;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth2callback`;

async function main() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    console.error(
      "Defina GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CLIENT_SECRET no ambiente.\n" +
        "Ex.: GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... npm run drive:oauth"
    );
    process.exit(1);
  }

  const client = new OAuth2Client(clientId, clientSecret, REDIRECT_URI);
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("\nAbrindo o navegador para autorizar o Google Drive...");
  console.log("Se não abrir, acesse:\n");
  console.log(authUrl);
  console.log("");

  const code = await new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        if (!req.url?.startsWith("/oauth2callback")) {
          res.writeHead(404);
          res.end();
          return;
        }
        const url = new URL(req.url, REDIRECT_URI);
        const err = url.searchParams.get("error");
        if (err) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`<h1>Erro: ${err}</h1>`);
          reject(new Error(err));
          server.close();
          return;
        }
        const authCode = url.searchParams.get("code");
        if (!authCode) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing code");
          reject(new Error("Missing code"));
          server.close();
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          "<h1>Autorizado!</h1><p>Pode fechar esta aba e voltar ao terminal.</p>"
        );
        resolve(authCode);
        server.close();
      } catch (e) {
        reject(e);
        server.close();
      }
    });

    server.listen(REDIRECT_PORT, "localhost", () => {
      open(authUrl).catch(() => {
        /* usuário abre manualmente */
      });
    });
  });

  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      "Google não devolveu refresh_token. Revogue o acesso do app em " +
        "https://myaccount.google.com/permissions e rode de novo com prompt=consent."
    );
    process.exit(1);
  }

  console.log("\nCole no .env.local (e na Vercel):\n");
  console.log(`GOOGLE_OAUTH_CLIENT_ID=${clientId}`);
  console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${clientSecret}`);
  console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log(
    "GOOGLE_DRIVE_FOLDER_ID=<id da pasta — já deve estar no .env.local>"
  );
  console.log(
    "\nPode remover as variáveis GOOGLE_SERVICE_ACCOUNT_* (não funcionam em Drive pessoal).\n"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
