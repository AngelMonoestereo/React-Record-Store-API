import React, { useState } from "react";

const Browse = () => {
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setRecords([]);

    try {
      const response = await fetch(
        `https://api.discogs.com/database/search?q=${encodeURIComponent(
          query
        )}&per_page=6&type=release`,
        {
          headers: {
            "User-Agent": "VinylPourClub/1.0",
            Authorization:
              "Discogs token=yAZudpjLFanXUUfvmNvwrCIaqJeKudNrWrPEIywh",
          },
        }
      );

      const data = await response.json();
      setRecords(data.results || []);
    } catch (err) {
      console.error("Error fetching records:", err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="browse">
      <h1>Vinyl Pour Club</h1>
      <form onSubmit={handleSearch} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search records..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && records.length === 0 && (
        <p>No records found. Try searching!</p>
      )}

      <div className="record-list" style={{ display: "grid", gap: "1rem" }}>
        {records.map((record) => (
          <div key={record.id} className="record-card">
            <a href={`/record/${record.id}`}>
              <img
                src={record.cover_image}
                alt={record.title}
                style={{ width: "100%" }}
              />
              <h3>{record.title}</h3>
              <p>{record.year || "Unknown year"}</p>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Browse;
