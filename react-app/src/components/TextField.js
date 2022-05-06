import React from 'react';

function TextField({field, id, onChange}) {
  return (
    <div>
        <label> {field.name}
            <input className='element' type="text" name={(field.name).toLowerCase().replace(' ', '')} id={id} onChange={(e) => onChange(e)}/>
          </label>
    </div>
  )
}

export default TextField