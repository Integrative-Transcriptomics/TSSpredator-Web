import React from 'react';

/** creates text field with label
 * 
 * @param field: field saved as object
 * @param id: id of the Genom/Replicate Tab
 * @param studyType: 'condtion' or 'genome'
 * @param handleTabs: saves input for text fiels
 */
function TextField({ field, id, studyType, handleTabs }) {

  let disabled = false;
  let value = "";

  if (studyType === 'condition') {
    disabled = true;
    if (field.name === 'Alignment ID') {
      value = id + 1;
    }
  }

  return (
    <div className='text-field-box'>
      <label htmlFor={id}> {field.name}</label>
      <input disabled={disabled} className={disabled ? 'element text-field disabled-field' : 'element text-field'} type="text" name={(field.name).toLowerCase().replace(' ', '')} defaultValue={value} id={id}
        onChange={(e) => handleTabs(e)} />
    </div>
  )
}

export default TextField