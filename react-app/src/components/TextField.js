import React from 'react';

/** ersellt einzelnes Text Feld mit Label
 * 
 * @param field:  inzelnes Feld als Objekt
 * @param id: id des Genom/Replicate Tabs
 * @param handleTabs: Funktion um Eingaben in Textfeldern des Genom Tabs anzuspeichern
 * @param studyType: 'condtion' oder 'genome'
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
      <label for={id}> {field.name}</label>
      <input disabled={disabled} className='element text-field' type="text" name={(field.name).toLowerCase().replace(' ', '')} defaultValue={value} id={id}
        onChange={(e) => handleTabs(e)} />
    </div>
  )
}

export default TextField