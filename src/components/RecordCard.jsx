import React from "react";
import { Link } from "react-router-dom";

export default function RecordCard({ record }) {
  return (
    <Link
      to={`/record/${record.id}`}
      className="record-card"
      style={{
        display: "block",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
        padding: "10px",
        textAlign: "center",
        transition: "0.3s ease",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <img
        src={record.cover_image}
        alt={record.title}
        style={{
          width: "100%",
          borderRadius: "8px",
          height: "200px",
          objectFit: "cover",
        }}
      />
      <h3 style={{ margin: "10px 0 5px" }}>{record.title}</h3>
      <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#666" }}>
        {record.year || "Unknown Year"}
      </p>
    </Link>
  );
}
