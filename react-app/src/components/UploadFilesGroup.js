import React from 'react';
import UploadFile from './UploadFile';

function UploadFilesGroup({files}) {
  return (
   
    files.map(file => {
            return <UploadFile file={file}/>
    })
  );
}

export default UploadFilesGroup