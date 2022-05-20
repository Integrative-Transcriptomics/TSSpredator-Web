import React from 'react';
import Parameter from './Parameter';

/** erstellt Parametergruppe 
 * 
 * @param parameters: Gruppe an Paramtern 
 * @param onChange: Funktion, um Parameter bei Änderungen abzuspeichern 
 */
function ParameterGroup({ parameters, onChange, grid }) {

  return (
    Object.keys(parameters).map((e, i) => {
      return <Parameter key={i} parameter={parameters[e]} grid={grid} onChange={(e) => onChange(e)} />
    }));
}

export default ParameterGroup