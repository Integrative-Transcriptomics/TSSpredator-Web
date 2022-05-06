import React from 'react';
import ParameterGroup from './ParameterGroup';

function ParameterAllGroups( { parameterGroups, preset, onChange }) {
  return (
    <div className='grid-wrapper'>
      {Object.keys(parameterGroups).map((e, i) => {
          return(
              <div key={e} className={e + "-grid"}>
                <h3 key={e} className={e + "-header"}> {e} </h3>
                {(typeof parameterGroups[e]=== 'undefined') ? (<p></p>) : (<ParameterGroup key={i} parameters={parameterGroups[e]} onChange={(e) => onChange(e)} />)}
              </div>
          )
      })}
  </div>
  );
}

export default ParameterAllGroups