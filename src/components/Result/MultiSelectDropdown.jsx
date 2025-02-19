import React, { useState, useRef, useEffect } from "react";
import "../../css/DropDown.css";

function MultiSelectDropdown({ column, selectionData, columnFilterValue }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(columnFilterValue || []);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelection = (option) => {
    let newSelection;
    if (option === "") {
      // If "All" is selected, clear selection
      newSelection = [];
    } else if (selectedOptions.includes(option)) {
      // If option is already selected, remove it
      newSelection = selectedOptions.filter((item) => item !== option);
    } else {
      // Otherwise, add it to the selection
      newSelection = [...selectedOptions, option];
    }

    setSelectedOptions(newSelection);
    column.setFilterValue(newSelection);
  };

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <div className="dropdown-header" onClick={toggleDropdown}>
        {selectedOptions.length > 0 ? selectedOptions.join(", ") : "Select options"}
        <span className="dropdown-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="dropdown-list">
          <label className="dropdown-item">
            <input
              type="checkbox"
              checked={selectedOptions.length === 0}
              onChange={() => handleSelection("")}
            />
            All
          </label>
          {selectionData[column.id] &&
            [...selectionData[column.id]].map((option, i) => (
              <label key={i} className="dropdown-item">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={() => handleSelection(option)}
                />
                {option}
              </label>
            ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelectDropdown;
