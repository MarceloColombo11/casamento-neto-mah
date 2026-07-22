/**
 * Google Apps Script para receber confirmações de presença (RSVP)
 *
 * IMPORTANTE: Crie o script a partir da planilha (Extensões > Apps Script)
 * para garantir acesso automático. Ou use o mesmo ID abaixo.
 *
 * Como usar:
 * 1. Abra a planilha no Google Sheets
 * 2. Linha 1 (headers): Data, Nome, Email, Nome do acompanhante, Microônibus
 * 3. Extensões > Apps Script (vincula o script à planilha)
 * 4. Cole este código, execute "testarAcesso" para autorizar
 * 5. Implante: Implantar > Nova implantação > Aplicativo da Web
 * 6. Execute como: Eu | Quem tem acesso: Qualquer pessoa
 * 7. Configure a URL em GOOGLE_APPS_SCRIPT_RSVP_URL
 */

const SPREADSHEET_ID = "17KrG8rcCGgOIheSB1cj2Kaqr4frYq5fAe3-2Gbw8XaQ";

/** GET: teste/autorização - abra a URL no navegador para autorizar o script */
function doGet() {
  try {
    getSpreadsheet(); // força autorização de acesso à planilha
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: "RSVP ativo. Use POST para enviar confirmações." }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** Execute esta função no editor para testar acesso (Run > testarAcesso) */
function testarAcesso() {
  try {
    const ss = getSpreadsheet();
    Logger.log("OK - Planilha: " + ss.getName());
  } catch (e) {
    Logger.log("ERRO: " + e.toString());
  }
}

function getSpreadsheet() {
  // Em Web App, getActiveSpreadsheet() retorna null — sempre usar openById
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!ss) throw new Error("Planilha não encontrada.");
    return ss;
  } catch (e) {
    throw new Error(
      "Não foi possível acessar a planilha " + SPREADSHEET_ID + ". " +
      "Confira se o script e a planilha estão na mesma conta Google e execute 'testarAcesso' no editor para autorizar. " +
      "Erro: " + (e.message || e.toString())
    );
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Requisição inválida");
    }
    const data = JSON.parse(e.postData.contents);
    const spreadsheet = getSpreadsheet();
    const sheets = spreadsheet.getSheets();
    if (!sheets || sheets.length === 0) throw new Error("Planilha sem abas.");
    const sheet = sheets[0];
    if (!sheet) throw new Error("Aba inválida.");

    const lastRow = Math.max(sheet.getLastRow(), 0);
    const nextRow = lastRow + 1;
    sheet.getRange(nextRow, 1, 1, 5).setValues([[
      new Date(),
      data.nome || '',
      data.email || '',
      data.nomeAcompanhante || '',
      data.microonibus || ''
    ]]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
