import React from "react";
import "../../css/Range.css";

function RangeFilter({ column, columnFilterValue }) {
  return (
    <div className="range-filter-container">
      <input
        type="number"
        value={(columnFilterValue)?.[0] ?? ""}
        onChange={(e) =>
          column.setFilterValue((old) => [e.target.value, old?.[1]])
        }
        placeholder="Min"
        className="range-input"
      />
      <span className="range-separator">–</span>
      <input
        type="number"
        value={(columnFilterValue)?.[1] ?? ""}
        onChange={(e) =>
          column.setFilterValue((old) => [old?.[0], e.target.value])
        }
        placeholder="Max"
        className="range-input"
      />
    </div>
  );
}

export default RangeFilter;
