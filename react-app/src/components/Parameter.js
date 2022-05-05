import React from 'react';

function Parameter({ parameter, onChange}) {

  if(!isNaN(parameter.value)) {
    return (
      <div className="grid-parameter">
          <label> {parameter.name}
              <input className='element' type="number" name={parameter.name} id={parameter.group} key={parameter.name} min={parameter.min} max={parameter.max} step={parameter.step} defaultValue={parameter.value}
                      onChange={(e) => onChange(e)}/>
          </label>
      </div>
    );
  } else {
    return (
      <div className="grid-parameter">
          <label className='element element-row'> {parameter.name}
            <select value={parameter.value} name={parameter.name} id={parameter.group} onChange={(e) => onChange(e)}>
              <option value="genome">{parameter.combo1}</option>
              <option value="condition">{parameter.combo2}</option>
            </select>
            
          </label>
      </div>
    );
  }
  
}

export default Parameter