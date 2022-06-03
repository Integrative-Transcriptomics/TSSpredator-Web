import React from 'react';

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
  if(parameter.name === 'cluster method') {
    value1 = parameter.combo1
    value2 = parameter.combo2
  }

  // when parameter value is a number -> input=number
  if (!isNaN(parameter.value)) {

    return (
      <div className={grid ? 'parameter-grid' : 'parameter-box margin-left'} title={parameter.tooltip}>
        <label className='element'> {parameter.name}</label>
        <input className='element' type="number" name={parameter.key} id={parameter.group} key={parameter.key} min={parameter.min} max={parameter.max}
          step={parameter.step} value={parameter.value} onChange={(e) => onChange(e)} />
      </div>
    );

  // combobox
  } else {
    return (
      <div className={grid ? 'parameter-select' : 'parameter-box margin-left'} title={parameter.tooltip}>
        <label className='element'> {parameter.name}</label>
        <select value={parameter.value} name={parameter.key} id={parameter.group} onChange={(e) => onChange(e)}>
          <option value={value1}>{parameter.combo1}</option>
          <option value={value2}>{parameter.combo2}</option>
        </select>
      </div>
    );
  }
}

export default Parameter