import React from 'react';


/** erstellt Komponente die einen individuellen upload buttons für Element enthält
 * 
 * @param file: Objekt -> enthält unter anderem Name der File für die ein upload Feld erstellt werden soll
 * @param id: id des Genom/Replicate Tabs
 * @param studyType: 'condtion' oder 'genome'
 */
function UploadFile({ file, id, studyType }) {

  let disabled = false;
  if (studyType === 'condition' && id > 0) {
    disabled = true;
  }

  const label = (file.name).toLowerCase().replace(' ', '');

  return (

    <div className='element-row'>
      <label> {file.name}
        <input disabled={disabled} className='element' type="file" name={label} id={id} />

      </label>

    </div>

  )
}

export default UploadFile