import React from 'react';
import ParameterGroup from './ParameterGroup';

/** erstellt Parametergruppe mit zugehöriger Überschrift
 * 
 * @param parameterGroups: Gruppe an Paramtern 
 * @param onChange: Funktion, um Parameter bei Änderungen abzuspeichern 
 */
function ParameterAllGroups({ parameterGroups, onChange, grid }) {
  return (
    <div className='grid-wrapper'>
      {Object.keys(parameterGroups).map((e, i) => {
        return (
          <div key={e} className={e + "-grid"}>
            <h3 key={e} className={e + "-header"}> {e} </h3>
            {(typeof parameterGroups[e] === 'undefined') ? (<p></p>) : (<ParameterGroup key={i} parameters={parameterGroups[e]} grid={grid} onChange={(e) => onChange(e)} />)}
          </div>
        )
      })}
    </div>
  );
}

export default ParameterAllGroups