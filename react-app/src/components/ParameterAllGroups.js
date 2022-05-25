import React from 'react';
import ParameterGroup from './ParameterGroup';

/** creates group of parameters with header
 * 
 * @param parameterGroups: group of parameters
 * @param onChange: function to save change
 * @param grid: true <-> parameter in parameter box, false <-> parameter in setup box
 */
function ParameterAllGroups({ parameterGroups, onChange, grid }) {
  return (
    <div className='grid-wrapper'>
      {Object.keys(parameterGroups).map((e, i) => {
        return (
          <div key={e} className={e + "-grid"}>
            <h3 key={e} className={e + "-header border-grid"}> {e} </h3>
            {(typeof parameterGroups[e] === 'undefined') ? (<p></p>) : (<ParameterGroup key={i} parameters={parameterGroups[e]} grid={grid} onChange={(e) => onChange(e)} />)}
          </div>
        )
      })}
    </div>
  );
}

export default ParameterAllGroups