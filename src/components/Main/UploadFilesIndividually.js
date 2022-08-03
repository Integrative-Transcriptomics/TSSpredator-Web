import React, { useState } from 'react';
import UploadFilesGroup from './UploadFilesGroup';


/** creates: Button(upload files together), menu (upload files individually), buttons (individual upload buttons)
 * 
 * @param files: object -> file labels
 * @param id: genome/replicate index
 * @param studyType: 'condtion' or 'genome'
 * @param handleTabs: saves input in text fields of genome tab
 * @param saveIndividualFile: saves a selected file
 * @param saveAnnotationFile: saves annotation files
 * @param multiFasta: true <-> genome file for this genome is multiFasta, else false
 */
function UploadFilesIndividually({ files, id, studyType, genomes, handleTabs, saveIndividualFile, saveAnnotationFile, multiFasta }) {

  const [show, setShow] = useState(false);

  return (
    <div>
      <p className='element click' onClick={() => setShow(!show)}>{show ? '-' : '+'} Upload Files individually</p>
      <UploadFilesGroup files={files} id={id} studyType={studyType} genomes={genomes} handleTabs={(e) => handleTabs(e)}
                        saveIndividualFile={(e) => saveIndividualFile(e)} show={show} saveAnnotationFile={(e) => saveAnnotationFile(e)} multiFasta={multiFasta}/>
    </div>
  )
}

export default UploadFilesIndividually