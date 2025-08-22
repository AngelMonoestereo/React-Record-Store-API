import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getRelease, getMarketplaceStats } from "../api/discogs.js";
import "../styles/RecordDetail.css";

export default function RecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // I load the release + marketplace stats
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const rel = await getRelease(id);
        if (cancelled) return;
        setRecord(rel);

        // stats are optional; I don't block the page if they fail
        try {
          const s = await getMarketplaceStats(id);
          if (!cancelled) setStats(s);
        } catch {
          /* ignore stats errors */
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Could not load record.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <p className="loading">Loading record…</p>;

  if (error) {
    return (
      <div className="record-detail">
        <Link to="/results" className="back-link">← Back to results</Link>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="record-detail">
        <Link to="/results" className="back-link">← Back to results</Link>
        <div className="error">Record not found.</div>
      </div>
    );
  }

  const cover =
    (record.images && record.images[0]?.uri) || "/placeholder.png";

  const labels = Array.isArray(record.labels)
    ? record.labels
        .map((l) => `${l.name}${l.catno ? ` (${l.catno})` : ""}`)
        .join(", ")
    : "Unknown";

  const formats = Array.isArray(record.formats)
    ? record.formats
        .map((f) =>
          [f.name, f.text, ...(f.descriptions || [])].filter(Boolean).join(" ")
        )
        .join(" • ")
    : "—";

  const genres = record.genres?.join(", ") || "—";
  const styles = record.styles?.join(", ") || "—";

  const ratingAvg = record.community?.rating?.average ?? null;
  const ratingCnt = record.community?.rating?.count ?? null;
  const have = record.community?.have ?? null;
  const want = record.community?.want ?? null;

  const tracklist = Array.isArray(record.tracklist) ? record.tracklist : [];
  const videos = Array.isArray(record.videos) ? record.videos : [];

  const fmtUSD = (n) =>
    typeof n === "number" ? `$${n.toFixed(2)}` : "—";

  const price = {
    lowest: stats?.lowest_price,
    median: stats?.median,
    highest: stats?.highest_price,
    forSale: stats?.num_for_sale ?? stats?.number_for_sale,
  };

  return (
    <div className="record-detail">
      <button
        className="back-link"
        onClick={() => navigate(-1)}
        style={{ background: "none", border: 0, cursor: "pointer" }}
      >
        ← Back
      </button>

      <div className="record-content">
        {/* Cover */}
        <img src={cover} alt={record.title} className="record-detail-cover" />

        {/* Info */}
        <div className="record-info">
          <h1>{record.title}</h1>

          <p><strong>Release ID:</strong> {record.id}</p>
          <p><strong>Year:</strong> {record.year || "Unknown"}</p>
          <p><strong>Country:</strong> {record.country || "Unknown"}</p>
          <p><strong>Labels:</strong> {labels}</p>
          <p><strong>Format:</strong> {formats}</p>
          <p><strong>Genres:</strong> {genres}</p>
          <p><strong>Styles:</strong> {styles}</p>

          {/* Rating / Community */}
          {(ratingAvg || ratingCnt || have || want) && (
            <div style={{ marginTop: 10 }}>
              <strong>Rating:</strong>{" "}
              {ratingAvg ? `${ratingAvg.toFixed(2)} / 5` : "—"}
              {ratingCnt ? ` (${ratingCnt} votes)` : ""}
              {typeof have === "number" || typeof want === "number" ? (
                <span style={{ opacity: 0.85 }}>
                  {" "}
                  • Have: {have ?? "—"} • Want: {want ?? "—"}
                </span>
              ) : null}
            </div>
          )}

          {/* Marketplace prices */}
          <div style={{ marginTop: 10 }}>
            <strong>Marketplace:</strong>{" "}
            Lowest {fmtUSD(price.lowest)} • Median {fmtUSD(price.median)} • Highest {fmtUSD(price.highest)}{" "}
            {typeof price.forSale === "number" ? `• For sale: ${price.forSale}` : ""}
          </div>

          {/* Notes / Description */}
          {record.notes && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ margin: 0, color: "#ffcc00" }}>Description</h3>
              <p style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{record.notes}</p>
            </div>
          )}

          {/* Tracklist */}
          {tracklist.length > 0 && (
            <>
              <h3 style={{ marginTop: 16, color: "#ffcc00" }}>Tracklist</h3>
              <ul className="tracklist">
                {tracklist.map((t, i) => (
                  <li key={i}>
                    {t.position ? `${t.position} - ` : ""}
                    {t.title}
                    {t.duration ? ` (${t.duration})` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Videos (optional) */}
          {videos.length > 0 && (
            <>
              <h3 style={{ marginTop: 16, color: "#ffcc00" }}>Videos</h3>
              <ul style={{ paddingLeft: 18 }}>
                {videos.slice(0, 3).map((v, i) => (
                  <li key={i}>
                    <a href={v.uri} target="_blank" rel="noreferrer">
                      {v.title || "Watch on Discogs/YouTube"}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Link to Discogs */}
          <div style={{ marginTop: 16 }}>
            <a
              href={`https://www.discogs.com/release/${record.id}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#ffcc00", fontWeight: 700 }}
            >
              View on Discogs ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
