import React from 'react';
import { useState, useEffect, useRef } from 'react';
/** creates a parameter with label and input
 * 
 * @param parameter: parameter
 * @param onChange: function to save change 
 * @param grid: true <-> parameter in parameter box, false <-> parameter in setup box
 */
function Parameter({ parameter, onChange, grid }) {

  // for combo box
  let value1 = 'condition';
  let value2 = 'genome';
  if (parameter.name === 'cluster method') {
    value1 = parameter.combo1
    value2 = parameter.combo2
  }

  // when parameter value is a number -> input=number
  if (!isNaN(parameter.value)) {

    return (
      <div className={grid ? 'parameter-grid' : 'parameter-box margin-left'} >
        <label className='element element-text' data-title={parameter.tooltip}> {parameter.name}</label>
        <input className='element' type="number" name={parameter.key} id={parameter.group} key={parameter.key} min={parameter.min} max={parameter.max}
          step={parameter.step} value={parameter.value} onChange={(e) => onChange(e)} />
      </div>
    );

    // combobox
  } else {
    return (
      <div style={{ alignItems: "center" }} className={grid ? 'parameter-select' : 'parameter-box margin-left'}>
        <label className='element element-text' data-title={parameter.tooltip}> {parameter.name}</label>
        <DropDownWithoutHeader
          label={parameter.name}
          value={parameter.value}
          onChange={(value) => {
            let tmp = { target: { name: parameter.key, value: value, id: parameter.group, key: parameter.key } }
            onChange(tmp)
          }}
          options={[
            { value: value1, label: parameter.combo1 },
            { value: value2, label: parameter.combo2 },
          ]}
        />
      </div>
    );
  }
}

function DropDownWithoutHeader({ value, onChange, options, textColor = "black", style }) {

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
  return (<>
    <div className="custom-dropdown"
      style={{ width: "80%", color: textColor, ...style }}
      ref={dropdownRef}>
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
  </>
  )
}

export default Parameter