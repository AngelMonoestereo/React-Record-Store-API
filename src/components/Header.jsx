// src/components/Header.jsx
import { NavLink, Link } from "react-router-dom";

export default function Header(){
  return (
    <header className="site-header">
      <div className="container row">
        <Link to="/" className="brand" aria-label="Vinyl Pour Club home">
          <span className="dot" />
          Vinyl Pour Club
        </Link>

        <nav className="nav" aria-label="Main">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/results?q=vinyl&page=1">Browse</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
      </div>
    </header>
  );
}
