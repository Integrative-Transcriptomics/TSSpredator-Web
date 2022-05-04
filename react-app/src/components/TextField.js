import React from 'react';

function TextField({field}) {
  return (
    <div>
        <label> {field.name}
            <input className='element' type="text" name={field.name}/>
          </label>
    </div>
  )
}

export default TextField