import React from 'react';
import Parameter from './Parameter';

function ParameterGroup({parameters, onChange}) {
  
  return (
    Object.keys(parameters).map((e, i) => {
      return <Parameter key={i} parameter={parameters[e]} onChange={(e) => onChange(e)}/>
    }));
}

export default ParameterGroup