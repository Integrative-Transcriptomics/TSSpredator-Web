import React from 'react';

/** erstellt einzelnen Parameter mit Label
 * 
 * @param parameter: Paramter
 * @param onChange: Funktion, um Parameter bei Änderungen abzuspeichern 
 */
function Parameter({ parameter, onChange, grid }) {

  // wenn Parameter eine Nummer ist input=number Feld
  if (!isNaN(parameter.value)) {

    return (
      <div className={grid ? 'grid-parameter' : 'parameter-box margin-left'}>
        <label className='element' for={parameter.group}> {parameter.name}</label>
        <input className='element' type="number" name={parameter.key} id={parameter.group} key={parameter.key} min={parameter.min} max={parameter.max}
                  step={parameter.step} value={parameter.value} onChange={(e) => onChange(e)} />
      </div>
    );

  // wenn Parameter keine Nummer ist select Feld (ComboBox)
  } else {
    return (
      <div className={grid ? 'grid-parameter' : 'parameter-box margin-left'}>
        <label className='element' for={parameter.group}> {parameter.name}</label>
        <select className='element' value={parameter.value} name={parameter.key} id={parameter.group} onChange={(e) => onChange(e)}>
            <option value="genome">{parameter.combo1}</option>
            <option value="condition">{parameter.combo2}</option>
          </select>
      </div>
    );
  }
}

export default Parameter