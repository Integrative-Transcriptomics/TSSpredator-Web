import React from 'react';
import UploadFilesGroup from './UploadFilesGroup';


/** creates: Button(upload files together), menu (upload files individually), buttons (individual upload buttons)
 * 
 * @param files: object -> file labels
 * @param id: genome/replicate index
 * @param studyType: 'condtion' or 'genome'
 * @param handleTabs: saves input in text fields of genome tab
 * @param saveIndividualFile: saves a selected file
 */
function UploadFilesIndividually({ files, id, studyType, genomes, handleTabs, saveIndividualFile }) {

  return (
    <div>
      <p className='element'>+ Upload Files individually</p>
      <UploadFilesGroup files={files} id={id} studyType={studyType} genomes={genomes} handleTabs={(e) => handleTabs(e)}
                        saveIndividualFile={(e) => saveIndividualFile(e)} />
    </div>
  )
}

export default UploadFilesIndividually