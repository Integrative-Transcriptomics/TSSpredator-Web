import React from 'react';
import UploadFile from './UploadFile';


/** creates a group of upload buttons with label
 * 
 * @param files: object -> file labels
 * @param id: genome/replicate index
 * @param studyType: 'condtion' or 'genome'
 * @param genomes: object -> Genome/Replicates
 * @param handleTabs: saves input in text fields of genome tab
 * @param saveIndividualFile: saves a selected file
 * @param show: show or hide upload files individually
 * @param saveAnnotationFile: saves annotation files
 * @param multiFasta: true <-> genome file for this genome is multiFasta, else false
 */
function UploadFilesGroup({ files, id, studyType, genomes, handleTabs, saveIndividualFile, show, saveAnnotationFile, multiFasta}) {
  return (
    <div className='margin-left file-column'>
      {files.map((file, i) => {
        return <UploadFile file={file} key={i} id={id} studyType={studyType} genomes={genomes} handleTabs={(e) => handleTabs(e)}
          saveIndividualFile={(e) => saveIndividualFile(e)} show={show} saveAnnotationFile={(e) => saveAnnotationFile(e)} multiFasta={multiFasta} />
      })
      }
    </div>
  )

}

export default UploadFilesGroup