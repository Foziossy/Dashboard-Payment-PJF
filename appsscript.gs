// ─────────────────────────────────────────────
//  Prambanan Jazz – Payment API
//  Pasang di: Extensions → Apps Script
//  Lalu: Deploy → New deployment → Web App
//  Execute as: Me | Who has access: Anyone
// ─────────────────────────────────────────────

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
                              .getSheetByName("Customer");
  const rows  = sheet.getDataRange().getValues();

  // Baris pertama = header: Nama Customer | Jumlah Tiket | Total Payment (% string)
  const headers = rows[0];
  const data    = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue; // skip baris kosong

    const name    = String(row[0]).trim();
    const tix     = Number(row[1]) || 0;
    const pctRaw  = row[2]; // bisa "25.0%" atau 0.25

    // Normalise persen → angka 0–100
    let pct;
    if (typeof pctRaw === "number") {
      pct = pctRaw <= 1 ? Math.round(pctRaw * 100) : Math.round(pctRaw);
    } else {
      pct = Math.round(parseFloat(String(pctRaw).replace("%", "")) || 0);
    }

    data.push({ name, tix, pct });
  }

  const payload = JSON.stringify({ ok: true, updated: new Date().toISOString(), data });

  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders
    ? addCors(payload)
    : ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
}

// Tambah CORS header agar bisa di-fetch dari Vercel
function addCors(payload) {
  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
  // Apps Script otomatis allow CORS untuk GET — tidak perlu manual
}
