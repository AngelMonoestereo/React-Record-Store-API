import React from "react";

export default function SortDropdown({ onSort }) {
  return (
    <select onChange={(e) => onSort(e.target.value)}>
      <option value="">Sort By</option>
      <option value="title_asc">Title (A-Z)</option>
      <option value="title_desc">Title (Z-A)</option>
      <option value="price_low">Price (Low to High)</option>
      <option value="price_high">Price (High to Low)</option>
    </select>
  );
}
