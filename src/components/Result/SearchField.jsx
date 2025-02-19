import React from "react";
import "../../css/SearchInput.css";

function SearchInput({ column, columnFilterValue }) {
  return (
    <div className="search-input-container">
      <input
        type="text"
        value={columnFilterValue ?? ""}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder="Search..."
        className="search-input"
      />
    </div>
  );
}

export default SearchInput;
