import React from 'react';


/** individual button for uploading a file 
 * 
 * @param file: object -> field name 
 * @param id: id des Genom/Replicate Tabs
 * @param studyType: 'condtion' oder 'genome'
 * @param saveIndividualFile: saves selected file
 */
function UploadFile({ file, id, studyType, genomes, saveIndividualFile, show }) {

  let disabled = false;
  if (studyType === 'condition' && id > 0) {
    disabled = true;
  }

  const label = (file.name).toLowerCase().replace(' ', '');

  let fileName;
  let gIdx;
  let rIdx;
  // for replicate tab
  if (Array.isArray(id)) {
    rIdx = id[1];
    let rep = "replicate" + String.fromCharCode(97 + rIdx)
    fileName = genomes[rIdx][rep][label].name;
    // for genome files
  } else {
    gIdx = id;
    fileName = genomes[gIdx]['genome' + (gIdx + 1)][label].name;
  }

  return (

    <div className={show ? 'file-box' : 'hidden'}>
      <p className='file-row'>{file.name}</p>
      <label className='element-row file-row' htmlFor={id+'file'}> 
        <input disabled={disabled} className='element' type="file" name={label} id={id + 'file'} style={{ display: 'none' }}
          onChange={(e) => saveIndividualFile(e)} />
        <p className={disabled ? 'button disabled' : 'button'}>Select File</p>
        {typeof fileName === 'undefined' ? <p className='file-name'>No file selected.</p> : <p className='file-name'>{fileName}</p>}
      </label>

    </div>

  )
}

export default UploadFile