import React from 'react'

function UploadFile({ file, id, studyType, onChange }) {

  let disabled = false;

  if(studyType === 'condition' && id > 0) {
    disabled = true;
  }

  return (
    <div>
        <label> { file.name }
            <input disabled={disabled} className='element' type="file" name={(file.name).toLowerCase().replace(' ', '')} id={id} onChange={(e) => onChange(e)} />
        </label>
    </div>
  )
}

export default UploadFile