import React from 'react';
import UploadFile from './UploadFile';

function UploadFilesGroup({files, id, studyType, onChange}) {
  return (
   
    files.map((file, i) => {
            return <UploadFile file={file} key={i} id={id} studyType={studyType} onChange={(e) => onChange(e)}/>
    })
  );
}

export default UploadFilesGroup