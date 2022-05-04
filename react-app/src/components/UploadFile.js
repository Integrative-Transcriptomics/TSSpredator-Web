import React from 'react'

function UploadFile({ file }) {
  return (
    <div>
        <label> { file.name }
            <input className='element' type="file" name={file.name} />
        </label>
    </div>
  )
}

export default UploadFile