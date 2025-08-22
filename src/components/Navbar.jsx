import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: "1rem", background: "#222", color: "#fff" }}>
      <Link to="/" style={{ color: "white", textDecoration: "none" }}>
        Vinyl Pour Club
      </Link>
    </nav>
  );
}
