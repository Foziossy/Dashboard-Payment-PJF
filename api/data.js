// api/data.js — Vercel Serverless Function
// Bertugas sebagai "kasir" yang ambil data dari Apps Script
// Token TIDAK pernah kelihatan di browser

export default async function handler(req, res) {

  // Hanya izinkan method GET
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  // Token diambil dari environment variable Vercel (tidak kelihatan di kode frontend)
  const token     = process.env.APPS_SCRIPT_TOKEN;
  const scriptUrl = process.env.APPS_SCRIPT_URL;

  if (!token || !scriptUrl) {
    return res.status(500).json({ ok: false, error: "Server misconfigured" });
  }

  try {
    const upstream = await fetch(`${scriptUrl}?token=${token}&t=${Date.now()}`);

    if (!upstream.ok) {
      return res.status(502).json({ ok: false, error: "Upstream error " + upstream.status });
    }

    const data = await upstream.json();

    // Cache response 15 detik di browser, 30 detik di CDN Vercel
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=15");
    return res.status(200).json(data);

  } catch (err) {
    return res.status(502).json({ ok: false, error: "Fetch failed: " + err.message });
  }
}
