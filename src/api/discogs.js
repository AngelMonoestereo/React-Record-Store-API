// src/api/discogs.js
const BASE = "https://api.discogs.com";
const TOKEN = import.meta.env.VITE_DISCOGS_TOKEN;

const withToken = (u) =>
  `${u}${u.includes("?") ? "&" : "?"}token=${encodeURIComponent(TOKEN || "")}`;

async function throwDetailed(res) {
  let detail = "";
  try {
    const data = await res.json();
    detail = data?.message || JSON.stringify(data);
  } catch {
    detail = res.statusText || "Unknown error";
  }
  const err = new Error(`${res.status} ${res.statusText} - ${detail}`);
  err.status = res.status;
  throw err;
}

export async function searchReleases(query, page = 1, perPage = 12) {
  if (!TOKEN) {
    const err = new Error("Missing Discogs token (VITE_DISCOGS_TOKEN).");
    err.status = 401;
    throw err;
  }
  const url = withToken(
    `${BASE}/database/search?q=${encodeURIComponent(query)}&type=release&page=${page}&per_page=${perPage}`
  );
  const res = await fetch(url);
  if (!res.ok) await throwDetailed(res);
  return res.json();
}

export async function getRelease(id) {
  if (!TOKEN) {
    const err = new Error("Missing Discogs token (VITE_DISCOGS_TOKEN).");
    err.status = 401;
    throw err;
  }
  const url = withToken(`${BASE}/releases/${id}`);
  const res = await fetch(url);
  if (!res.ok) await throwDetailed(res);
  return res.json();
}

// Intento primero price suggestions (suele existir para casi todo).
// Si no hay, bajo a marketplace stats.
export async function getPrices(id) {
  if (!TOKEN) {
    const err = new Error("Missing Discogs token (VITE_DISCOGS_TOKEN).");
    err.status = 401;
    throw err;
  }

  // 1) Sugerencias por condición
  try {
    const u1 = withToken(`${BASE}/marketplace/price_suggestions/${id}?curr_abbr=USD`);
    const r1 = await fetch(u1);
    if (r1.ok) {
      const s = await r1.json(); // { "Near Mint (NM or M-)": {value}, "Very Good Plus (VG+)": {value}, ... }
      const pick = (...keys) => keys.map(k => s?.[k]?.value).find(v => typeof v === "number");
      const vgPlus = pick("Very Good Plus (VG+)");
      const nm = pick("Near Mint (NM or M-)");
      const vg = pick("Very Good (VG)");
      const values = Object.values(s || {})
        .map(v => v?.value)
        .filter(n => typeof n === "number");

      const typical = vgPlus ?? nm ?? vg ?? (values.length ? values.sort((a,b)=>a-b)[Math.floor(values.length/2)] : null);
      const min = values.length ? Math.min(...values) : null;
      const max = values.length ? Math.max(...values) : null;

      return { typical, min, max, source: "suggestions", suggestions: s };
    }
  } catch { /* sigo al fallback */ }

  // 2) Fallback marketplace stats
  try {
    const u2 = withToken(`${BASE}/marketplace/stats/${id}?curr_abbr=USD`);
    const r2 = await fetch(u2);
    if (!r2.ok) {
      if (r2.status === 404 || r2.status === 429) return null;
      await throwDetailed(r2);
    }
    const j = await r2.json(); // suele traer lowest_price y num_for_sale
    const typical = typeof j.median === "number" ? j.median : (typeof j.lowest_price === "number" ? j.lowest_price : null);
    const min = typeof j.lowest_price === "number" ? j.lowest_price : null;
    const max = typeof j.highest_price === "number" ? j.highest_price : null;
    return { typical, min, max, forSale: j.num_for_sale ?? j.number_for_sale, source: "stats" };
  } catch {
    return null;
  }
}

// Mantengo estos si los usas en otras partes:
export async function getMarketplaceStats(id) {
  if (!TOKEN) {
    const err = new Error("Missing Discogs token (VITE_DISCOGS_TOKEN).");
    err.status = 401;
    throw err;
  }
  const url = withToken(`${BASE}/marketplace/stats/${id}?curr_abbr=USD`);
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}
