import React from 'react'
import UploadFilesGroup from './UploadFilesGroup'

function UploadFilesIndividually({files, id, studyType, onChange}) {
  return (
    <div>
        <label>
            <input className='element' type="button" value="upload files together"/>
        </label>
    
        <p className='element'>+ Upload Files individually</p>
        <UploadFilesGroup files={files} id={id} studyType={studyType} onChange={(e) => onChange(e)} />
    </div>
  )
}

export default UploadFilesIndividually