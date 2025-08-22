import React from "react";

export default function Pagination({ page, setPage }) {
  return (
    <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
        Previous
      </button>
      <span>Page {page}</span>
      <button onClick={() => setPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
