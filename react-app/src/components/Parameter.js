import React from 'react';
import Combobox from "react-widgets/Combobox";

function Parameter({ parameter }) {

  if(!isNaN(parameter.value)) {
    return (
      <div>
          <label> { parameter.name }
              <input key={parameter.name} type="number" min={ parameter.min } max={ parameter.max } step={ parameter.step } value={ parameter.value } />
          </label>
      </div>
    );
  } else {
    return (
      <div>
          <label  style={{display:'flex',flexDirection:'row'}}> {parameter.name}
            <Combobox key={parameter.name} defaultValue={parameter.value} data={[parameter.value, parameter.combo2]}/>
          </label>
      </div>
    );
  }
  
}

export default Parameter