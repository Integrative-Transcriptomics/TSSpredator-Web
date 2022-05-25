import React from 'react';
import Parameter from './Parameter';

/** creates group of parameters
 * 
 * @param parameterGroups: group of parameters
 * @param onChange: function to save change
 * @param grid: true <-> parameter in parameter box, false <-> parameter in setup box
 */
function ParameterGroup({ parameters, onChange, grid }) {

  return (
    Object.keys(parameters).map((e, i) => {
      return <Parameter key={i} parameter={parameters[e]} grid={grid} onChange={(e) => onChange(e)} />
    })

  )
}

export default ParameterGroup