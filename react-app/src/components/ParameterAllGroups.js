import React from 'react';
import ParameterGroup from './ParameterGroup';

function ParameterAllGroups( { parameterGroups }) {
  return (
    <div className='grid-wrapper'>
      {parameterGroups.map(group => {
          return(
              <div className={group.name + "-grid"}>
                <h3 className={group.name + "-header"}> { group.name} </h3>
                {(typeof group.parameters === 'undefined') ? (<p></p>) : (<ParameterGroup parameters={group.parameters}/>)}
              </div>
          )
      })}
  </div>
  );
}

export default ParameterAllGroups