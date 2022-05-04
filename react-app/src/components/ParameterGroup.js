import React from 'react';
import Parameter from './Parameter';

function ParameterGroup({ parameters }) {
  return (
    parameters.map((parameter,i) => {
        return <Parameter key={i} parameter={parameter} />
    })
  );
}

export default ParameterGroup