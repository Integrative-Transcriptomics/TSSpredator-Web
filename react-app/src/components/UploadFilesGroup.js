import React from 'react';
import UploadFile from './UploadFile';

function UploadFilesGroup({files}) {
  return (
   
    files.map((file, i) => {
            return <UploadFile file={file} key={i}/>
    })
  );
}

export default UploadFilesGroup