import React from 'react';
import UploadFilesGroup from './UploadFilesGroup';


/** erstellt komponente die enthält: Button(upload files together), aufklappbarer text (upload files individually), buttons (individuelle upload buttons)
 * 
 * @param files: Objekt -> enthält unter anderem Name der File für die ein upload Feld erstellt werden soll
 * @param id: id des Genom/Replicate Tabs
 * @param studyType: 'condtion' oder 'genome'
 * @param genomes: Objekt -> Genome/Replicates
 * @param handleTabs: Funktion um Eingaben in Textfeldern des Genom Tabs anzuspeichern
 */
function UploadFilesIndividually({ files, id, studyType, genomes, handleTabs }) {

  return (
    <div>
      <p className='element'>+ Upload Files individually</p>
      <UploadFilesGroup files={files} id={id} studyType={studyType} genomes={genomes} handleTabs={(e) => handleTabs(e)} />
    </div>
  )
}

export default UploadFilesIndividually