import React from 'react';
import UploadFile from './UploadFile';

function UploadFilesGroup({files, id, studyType, genomes, handleTabs, saveFiles}) {
  return (
   
    files.map((file, i) => {
            return <UploadFile file={file} key={i} id={id} studyType={studyType} genomes={genomes} handleTabs={(e) => handleTabs(e)} saveFiles={(e) => saveFiles(e)}/>
    })
  );
}

export default UploadFilesGroup