/*
  Voximeta — ricezione form Brand Audit + Waitlist su Google Sheets.

  SETUP:
  1. Crea un nuovo Google Sheet (vuoto va bene, i tab si creano da soli).
  2. Estensioni -> Apps Script.
  3. Cancella il contenuto di Code.gs e incolla tutto questo file.
  4. Salva (icona dischetto).
  5. Deploy -> Nuova implementazione -> tipo "Web app".
     - Esegui come: Me
     - Chi ha accesso: Chiunque
  6. Autorizza i permessi richiesti (è il tuo stesso account Google).
  7. Copia l'URL "Web app" che ti viene dato.
  8. Incollalo in main.js al posto di INCOLLA_QUI_URL_WEB_APP
     (variabile GOOGLE_SHEETS_URL, vicino alla funzione submitLead).

  Ogni volta che modifichi questo script devi ripubblicarlo:
  Deploy -> Gestisci implementazioni -> icona matita -> Nuova versione -> Esegui il deploy.
*/

var SHEET_BRAND_AUDIT = "Brand Audit";
var SHEET_WAITLIST = "Waitlist";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);

    // honeypot: bot compilato il campo nascosto -> finge successo, non scrive nulla
    if (data.botcheck) {
      return jsonOutput({ success: true });
    }

    var isWaitlist = (data.subject || "").indexOf("Waitlist") !== -1;
    var sheetName = isWaitlist ? SHEET_WAITLIST : SHEET_BRAND_AUDIT;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    var headers = isWaitlist
      ? ["Data/Ora", "Nome e cognome", "Email", "Telefono", "Social", "Prezzo servizio", "Fatturato mensile", "Chi gestisce i contenuti", "Investimento mensile ads", "Blocco attuale"]
      : ["Data/Ora", "Nome e cognome", "Email", "Telefono", "Social", "Attività", "Motivazione"];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    var row = isWaitlist
      ? [new Date(), data.full_name, data.email, data.phone, data.social, data.ticket, data.monthly_revenue, data.content_owner, data.monthly_budget, data.blocker]
      : [new Date(), data.full_name, data.email, data.phone, data.social, data.business, data.why];

    sheet.appendRow(row);

    return jsonOutput({ success: true });
  } catch (err) {
    return jsonOutput({ success: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
