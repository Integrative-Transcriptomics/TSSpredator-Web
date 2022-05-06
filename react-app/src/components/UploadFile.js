import React from 'react'

function UploadFile({ file, id, onChange }) {
  return (
    <div>
        <label> { file.name }
            <input className='element' type="file" name={(file.name).toLowerCase().replace(' ', '')} id={id} onChange={(e) => onChange(e)} />
        </label>
    </div>
  )
}

export default UploadFile