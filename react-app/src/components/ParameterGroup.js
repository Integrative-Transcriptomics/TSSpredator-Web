import React from 'react';
import Parameter from './Parameter';

function ParameterGroup({ parameters }) {
  return (
    parameters.map(parameter => {
        return <Parameter key={parameter.name} parameter={parameter}/>
    })
  );
}

export default ParameterGroup