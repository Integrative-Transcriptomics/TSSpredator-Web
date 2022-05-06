import React from 'react'

function UploadFile({ file, studyType }) {
  return (
    <div>
        <label> { file.name }
            <input className='element' type="file" name={file.name} />
        </label>
    </div>
  )
}

export default UploadFile