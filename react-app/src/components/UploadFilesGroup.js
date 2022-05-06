import React from 'react';
import UploadFile from './UploadFile';

function UploadFilesGroup({files, id, onChange}) {
  return (
   
    files.map((file, i) => {
            return <UploadFile file={file} key={i} id={id} onChange={(e) => onChange(e)}/>
    })
  );
}

export default UploadFilesGroup