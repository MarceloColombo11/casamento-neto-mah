/**
 * LEGADO — não use em novos deploys.
 *
 * O upload de fotos/vídeos agora usa Google Drive API (resumable) via
 * Service Account. Veja README.md (seção "Upload de mídias").
 *
 * Este script (base64 → DriveApp) ficou limitado pelo body da Vercel (~4,5 MB)
 * e não suportava vídeo de forma confiável.
 *
 * Variáveis do site (novo fluxo):
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 * - GOOGLE_DRIVE_FOLDER_ID
 */
