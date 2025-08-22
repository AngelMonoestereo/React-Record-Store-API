// src/pages/Home.jsx
import SearchBar from "../components/SearchBar";

export default function Home() {
  return (
    <section className="home-hero">
      <div className="hero-inner">
        <div style={{display:"inline-flex", gap:10, alignItems:"center", opacity:.9}}>
          <span style={{width:8, height:8, background:"var(--brand)", borderRadius:999}} />
          <span style={{fontWeight:700, letterSpacing:.3}}>VINYL POUR CLUB</span>
        </div>

        <h1 className="hero-title">
  Discover your next favorite <span style={{color:"var(--brand)"}}>Vinyl Record</span>
</h1>

        <p className="hero-sub">I search Discogs and show prices, ratings, and full details.</p>

        <div className="search-bar">
          {/* I reuse my SearchBar, but styled via global classes */}
          <SearchBar
            inputClass="input"
            buttonClass="btn btn-primary"
            placeholder="Search by artist, album, or keyword"
          />
        </div>
      </div>
    </section>
  );
}
