import React from 'react';

function Parameter({ parameter }) {
  return (
    <div>
        <label> { parameter.name }
            <input type="number" min={ parameter.min } max={ parameter.max } step={ parameter.step } value={ parameter.value } />
        </label>
    </div>
  );
}

export default Parameter