// Results.jsx — stable search + background prices (with 24h cache) + ONLY quick ranges
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchReleases, getPrices, getRelease } from "../api/discogs.js";
import "../styles/Results.css";

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/* ---------- price cache (24h) ---------- */
const PRICE_TTL_MS = 24 * 60 * 60 * 1000;
const priceCacheKey = (id) => `discogs:price:${id}`;

function readPriceCache(id) {
  try {
    const raw = localStorage.getItem(priceCacheKey(id));
    if (!raw) return null;
    const { ts, v } = JSON.parse(raw);
    if (!v || Date.now() - ts > PRICE_TTL_MS) return null;
    return v;
  } catch {
    return null;
  }
}

function writePriceCache(id, v) {
  try {
    localStorage.setItem(priceCacheKey(id), JSON.stringify({ ts: Date.now(), v }));
  } catch {
    // ignore quota errors
  }
}
/* -------------------------------------- */

export default function Results() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const legacy = params.get("search");
  const page = parseInt(params.get("page") || "1", 10);

  // base data
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // prices
  const pricesMapRef = useRef(new Map());
  const [pricesReady, setPricesReady] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const autoLoadRef = useRef(false);

  // price range (sin slider/inputs, solo presets)
  const [priceFloor, setPriceFloor] = useState(0);
  const [priceCeil, setPriceCeil] = useState(100);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(100);
  const [includeUnknown, setIncludeUnknown] = useState(true);

  // sorting
  const [sortOption, setSortOption] = useState("relevance");

  // normalize ?search= → ?q=
  useEffect(() => {
    if (!q && legacy) setParams({ q: legacy, page: "1" }, { replace: true });
  }, [q, legacy, setParams]);

  const queryKey = `${q || legacy || ""}::${page}`;

  // === Fetch Discogs search ===
  useEffect(() => {
    const term = q || legacy || "";
    if (!term) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");

    setPricesReady(false);
    pricesMapRef.current = new Map();
    autoLoadRef.current = false;

    searchReleases(term, page, 12)
      .then((data) => {
        if (cancelled) return;
        const results = Array.isArray(data?.results) ? data.results : [];
        setRecords(results);
        setPagination(data?.pagination || { page: 1, pages: 1 });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Search failed");
        setRecords([]);
        setPagination({ page: 1, pages: 1 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [queryKey]);

  // === Load prices (background + cache + fallback) ===
  async function loadPricesNow() {
    if (!records.length) return;

    setEnriching(true);
    setPricesReady(false);

    const map = new Map();

    for (const r of records) {
      const id = r.id;
      let v = readPriceCache(id);

      if (!v) {
        try { v = await getPrices(id); } catch {}

        const noNumbers = !v || (v.typical == null && v.min == null && v.max == null);
        if (noNumbers) {
          try {
            const rel = await getRelease(id);
            const lp = typeof rel?.lowest_price === "number" ? rel.lowest_price : null;
            if (lp != null) v = { typical: lp, min: lp, max: lp, source: "release_lowest" };
          } catch {}
        }

        writePriceCache(id, v || {});
      }

      map.set(id, v || {});
      pricesMapRef.current.set(id, v || {});

      await new Promise((res) => setTimeout(res, 150));
    }

    const values = records
      .map((r) => {
        const s = map.get(r.id) || {};
        return (
          (typeof s.typical === "number" && s.typical) ||
          (typeof s.min === "number" && s.min) ||
          (typeof s.max === "number" && s.max) ||
          null
        );
      })
      .filter((n) => n != null);

    const observedMax = values.length ? Math.ceil(Math.max(...values, 50)) : 50;

    setPriceFloor(0);
    setPriceCeil(observedMax);
    setPriceMin(0);
    setPriceMax(observedMax);

    setPricesReady(true);
    setEnriching(false);
  }

  // auto-load prices silently
  useEffect(() => {
    if (records.length > 0 && !pricesReady && !enriching && !autoLoadRef.current) {
      autoLoadRef.current = true;
      loadPricesNow();
    }
  }, [records, pricesReady, enriching]);

  // merge prices
  const withPrices = useMemo(() => {
    return records.map((r) => {
      const s = pricesMapRef.current.get(r.id) || {};
      const price =
        (typeof s.typical === "number" && s.typical) ||
        (typeof s.min === "number" && s.min) ||
        (typeof s.max === "number" && s.max) ||
        null;
      return { ...r, _price: price, _priceSource: s.source || "" };
    });
  }, [records, pricesReady, enriching]);

  // filter + sort
  const displayed = useMemo(() => {
    const base = pricesReady
      ? withPrices.filter((r) => {
          if (r._price == null) return includeUnknown;
          return r._price >= priceMin && r._price <= priceMax;
        })
      : withPrices;

    switch (sortOption) {
      case "year-asc": base.sort((a, b) => (a.year || 0) - (b.year || 0)); break;
      case "year-desc": base.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
      case "title-asc": base.sort((a, b) => (a.title || "").localeCompare(b.title || "")); break;
      case "price-asc": base.sort((a, b) => (a._price ?? Infinity) - (b._price ?? Infinity)); break;
      case "price-desc": base.sort((a, b) => (b._price ?? -Infinity) - (a._price ?? -Infinity)); break;
      default: break;
    }
    return base;
  }, [withPrices, pricesReady, priceMin, priceMax, includeUnknown, sortOption]);

  // helpers
  const goPage = (p) => setParams({ q: q || legacy || "", page: String(p) });

  // render guards
  if (!q && !legacy) {
    return (
      <div className="results-container" style={{ textAlign: "center" }}>
        <img src="/no-results.png" alt="Start searching" className="no-results-img" />
        <h3 style={{ marginTop: 8 }}>Start by searching for an artist or album</h3>
        <p style={{ opacity: 0.8 }}>Use the search bar on the Home page or try Browse.</p>
      </div>
    );
  }

  if (loading) return <p className="loading">Searching Discogs…</p>;

  if (error) {
    return (
      <div className="results-container">
        <div className="error-state">
          <img src="/no-results.png" alt="Error" className="no-results-img" style={{ maxWidth: 220, marginBottom: 12 }} />
          <p style={{ marginBottom: 12 }}>Oops, something went wrong.</p>
          <p style={{ opacity: 0.8, marginBottom: 16 }}>{error}</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="no-results">
        <img src="/no-results.png" alt="No results" className="no-results-img" />
        <p>No results found for “{q || legacy}”.</p>
      </div>
    );
  }

  return (
    <div className="results-container">
      <h2>
        Search results for “{q || legacy}”{" "}
        <span style={{ opacity: 0.7, fontSize: 14 }}>({displayed.length})</span>
      </h2>

      <div className="controls" style={{ alignItems: "center", gap: 16 }}>
        {pricesReady && (
          <>
            <div className="price-range">
              <span>Price: {USD.format(priceMin)} – {USD.format(priceMax)}</span>

              {/* SOLO QUICK RANGES */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
                <span style={{ opacity: 0.8 }}>Quick ranges:</span>
                <button onClick={() => { setPriceMin(0); setPriceMax(Math.min(20, priceCeil)); }}>$0–$20</button>
                <button onClick={() => { setPriceMin(20); setPriceMax(Math.min(50, priceCeil)); }}>$20–$50</button>
                <button onClick={() => { setPriceMin(50); setPriceMax(Math.min(100, priceCeil)); }}>$50–$100</button>
                <button onClick={() => { setPriceMin(priceFloor); setPriceMax(priceCeil); }}>All</button>
                <label style={{ fontSize: 13, marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={includeUnknown}
                    onChange={(e) => setIncludeUnknown(e.target.checked)}
                  />
                  include items without price
                </label>
              </div>
            </div>

            <label>
              Sort:&nbsp;
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="relevance">Relevance</option>
                <option value="year-asc">Oldest → Newest</option>
                <option value="year-desc">Newest → Oldest</option>
                <option value="title-asc">Title A→Z</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
              </select>
            </label>
          </>
        )}
      </div>

      {/* grid */}
      <div className="results-grid">
        {displayed.map((r) => {
          const img = r.cover_image || r.thumb || "/placeholder.png";
          const priceText = r._price != null ? USD.format(r._price) : "—";
          return (
            <Link to={`/record/${r.id}`} key={`${r.id}-${r.catno || ""}`} className="card">
              <div className="cover-wrap">
                <img src={img} alt={r.title} className="cover-img" loading="lazy" />
              </div>
              <div className="card-info">
                <h3>{r.title}</h3>
                <div style={{ opacity: 0.8 }}>{r.year || "Unknown Year"}</div>
                <div className="price">{priceText}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {pagination.pages > 1 && (
        <div style={{ marginTop: 18, display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => goPage(Math.max(1, page - 1))} disabled={page <= 1}>Prev</button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button onClick={() => goPage(Math.min(pagination.pages, page + 1))} disabled={page >= pagination.pages}>Next</button>
        </div>
      )}
    </div>
  );
}
