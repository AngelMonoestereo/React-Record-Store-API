import React from "react";

export default function SkeletonCard() {
  return (
    <div
      style={{
        background: "#e0e0e0",
        borderRadius: "6px",
        padding: "10px",
        height: "250px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <div style={{ background: "#ccc", height: "150px", borderRadius: "4px" }} />
      <div style={{ background: "#ddd", height: "20px", borderRadius: "4px", marginTop: "10px" }} />
      <div style={{ background: "#ddd", height: "20px", borderRadius: "4px", width: "60%" }} />
    </div>
  );
}
