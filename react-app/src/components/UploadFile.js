import React, {useState} from 'react';
import DropzoneGroup from './DropzoneGroup';

function UploadFile({ file, id, studyType, genomes, saveFiles }) {

  const [drop, setDrop] = useState(false);
  file.id = id;

  let disabled = false;
  if(studyType === 'condition' && id > 0) {
    disabled = true;
  }

  const label = (file.name).toLowerCase().replace(' ', '');  

  return (
    <>
    {drop && <DropzoneGroup dropzones={[file]} closePopup={(e) => setDrop(!drop)} saveFiles={(e) => saveFiles(e)}/> }

    <div className='element-row'>
        <label> { file.name }
            <button disabled={disabled} className='element' type="file" name={label} id={id} onClick={(e) => setDrop(!drop)}>Upload File</button>
            {typeof genomes[id]['genome'+(id+1)][label].file === 'undefined' ? <></> : genomes[id]['genome'+(id+1)][label].file.path}
        </label>
       
    </div>
    </>
  )
}

export default UploadFile