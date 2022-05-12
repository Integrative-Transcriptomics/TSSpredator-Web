import React, {useState} from 'react';
import UploadFilesGroup from './UploadFilesGroup';
import DropzoneGroup from './DropzoneGroup';

function UploadFilesIndividually({files, id, studyType, genomes, handleTabs, saveFiles}) {

  const [drop, setDrop] = useState(false);
  files.forEach((file) => {
    file.id = id;
  })


  return (
    <>
    {drop && <DropzoneGroup dropzones={files} closePopup={(e) => setDrop(!drop)} saveFiles={(e) => saveFiles(e)}/> }
    <div>
        <label>
          <button className='element' type="button" onClick={() => setDrop(!drop)}>Upload Files together</button>
        </label>
    
        <p className='element'>+ Upload Files individually</p>
        <UploadFilesGroup files={files} id={id} studyType={studyType} genomes={genomes} handleTabs={(e) => handleTabs(e)} saveFiles={(e) => saveFiles(e)} />
    </div>
    </>
  )
}

export default UploadFilesIndividually