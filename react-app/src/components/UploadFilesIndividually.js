import React from 'react'
import UploadFilesGroup from './UploadFilesGroup'

function UploadFilesIndividually({files}) {
  return (
    <div>
        <label>
            <input className='element' type="button" value="upload files together"/>
        </label>
    
        <p className='element'>+ Upload Files individually</p>
        <UploadFilesGroup files={files} />
    </div>
  )
}

export default UploadFilesIndividually