import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar({ inputClass = "input", buttonClass = "btn btn-primary", placeholder="Search..." }) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    // navego usando ?q= para que Results lo lea bien
    navigate(`/results?q=${encodeURIComponent(q)}&page=1`);
  };

  return (
    <form onSubmit={onSubmit} className="search-bar">
      <input
        id="search"
        name="search"
        className={inputClass}
        value={term}
        onChange={(e)=>setTerm(e.target.value)}
        placeholder={placeholder}
      />
      <button type="submit" className={buttonClass}>Search</button>
    </form>
  );
}
