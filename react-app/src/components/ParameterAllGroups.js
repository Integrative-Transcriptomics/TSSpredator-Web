import React from 'react';
import ParameterGroup from './ParameterGroup';

function ParameterAllGroups( { parameterGroups }) {
  return (
    parameterGroups.map(group => {
        return(
            <div className={group.name}>
            <h3> { group.name} </h3>
            {(typeof group.parameters === 'undefined') ? (<p></p>) : (<ParameterGroup parameters={group.parameters}/>)} 
        </div>
        )
    })
  );
}

export default ParameterAllGroups