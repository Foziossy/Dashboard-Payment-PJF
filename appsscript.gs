// ─────────────────────────────────────────────
//  Prambanan Jazz – Payment API  (SECURED)
//  Pasang di: Extensions → Apps Script
//  Lalu: Deploy → New deployment → Web App
//  Execute as: Me | Who has access: Anyone
// ─────────────────────────────────────────────

// ⚠️  GANTI dengan token rahasia milikmu sendiri!
//     Gunakan token yang sama di index.html (API_TOKEN)
const SECRET_TOKEN = "prambananjazz-niki-2026";

// Rate limiting: max request per IP per menit
const RATE_LIMIT    = 20;   // max 20 request
const RATE_WINDOW   = 60;   // dalam 60 detik

function doGet(e) {

  // ── 1. TOKEN AUTH ───────────────────────────
  const token = e.parameter.token || "";
  if (token !== SECRET_TOKEN) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  // ── 2. RATE LIMITING (per IP) ───────────────
  const ip    = e.parameter.userIp || "unknown";
  const cache = CacheService.getScriptCache();
  const key   = "rl_" + ip;
  const hits  = Number(cache.get(key) || 0);

  if (hits >= RATE_LIMIT) {
    return jsonResponse({ ok: false, error: "Too Many Requests" }, 429);
  }
  cache.put(key, String(hits + 1), RATE_WINDOW);

  // ── 3. BACA DATA SHEET ──────────────────────
  let sheet;
  try {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Customer");
    if (!sheet) throw new Error("Sheet 'Customer' tidak ditemukan");
  } catch (err) {
    return jsonResponse({ ok: false, error: "Sheet error: " + err.message });
  }

  const rows = sheet.getDataRange().getValues();
  const data = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue; // skip baris kosong

    const name   = String(row[0]).trim();
    const tix    = Number(row[1]) || 0;
    const pctRaw = row[2]; // bisa "25.0%" atau 0.25

    // Normalise persen → angka 0–100
    let pct;
    if (typeof pctRaw === "number") {
      pct = pctRaw <= 1 ? Math.round(pctRaw * 100) : Math.round(pctRaw);
    } else {
      pct = Math.round(parseFloat(String(pctRaw).replace("%", "")) || 0);
    }

    // Clamp 0–100
    pct = Math.max(0, Math.min(100, pct));

    data.push({ name, tix, pct });
  }

  return jsonResponse({ ok: true, updated: new Date().toISOString(), data });
}

// ── HELPER ──────────────────────────────────
function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
