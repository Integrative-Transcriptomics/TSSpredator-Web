import React from 'react'
import UploadFilesGroup from './UploadFilesGroup'

function UploadFilesIndividually({files}) {
  return (
    <div className='upload-files-individually' style={{display:'flex',flexDirection:'column'}}>
        <label>
            <input type="button" value="upload files together"/>
        </label>
    
        <p>+ Upload Files individually</p>
        <UploadFilesGroup files={files} />
    </div>
  )
}

export default UploadFilesIndividually