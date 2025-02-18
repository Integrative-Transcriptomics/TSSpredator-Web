import React, { useState, useRef, useEffect } from "react";
import "../../css/DropDown.css"; // Import the same CSS for styling

function SingleSelectDropdown({ value, onChange, options, label, textColor = "black", style }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(value);
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
    setSelectedOption(option);
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="custom-dropdown"
      style={{ margin: "0 1em ", color: textColor, ...style }}
      ref={dropdownRef}>
      <h3 className="select-header">{label}</h3>
      <div className="dropdown-header" onClick={toggleDropdown}>
        {options.find((opt) => opt.value === selectedOption)?.label || "Select..."}
        <span className="dropdown-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="dropdown-list">
          {options.map((option, i) => (
            <label
              key={i}
              className="dropdown-item"
              onClick={() => handleSelection(option.value)}
            >
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default SingleSelectDropdown;