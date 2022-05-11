import React from 'react'
import UploadFilesGroup from './UploadFilesGroup'

function UploadFilesIndividually({files, id, studyType, onChange, uploadFiles}) {
  return (
    <div>
        <label>
          <button className='element' type="button" onClick={() => uploadFiles()}>Upload Files together</button>
        </label>
    
        <p className='element'>+ Upload Files individually</p>
        <UploadFilesGroup files={files} id={id} studyType={studyType} onChange={(e) => onChange(e)} />
    </div>
  )
}

export default UploadFilesIndividually