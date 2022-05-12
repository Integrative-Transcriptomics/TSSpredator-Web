import React from 'react';

function TextField({field, id, studyType, handleTabs}) {

  let disabled = false;
  let value = "";

  if(studyType === 'condition') {
    disabled = true;
    if(field.name === 'Alignment ID') {
      value = id+1;
    }
  }

  return (
    <div>
        <label> {field.name}
            <input disabled={disabled} className='element' type="text" name={(field.name).toLowerCase().replace(' ', '')} defaultValue={value} id={id} 
                    onChange={(e) => handleTabs(e)}/>
          </label>
    </div>
  )
}

export default TextField