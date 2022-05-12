import React, { useState } from 'react';
import UploadFilesGroup from './UploadFilesGroup';
import DropzoneGroup from './DropzoneGroup';

/** erstellt komponente die enthält: Button(upload files together), aufklappbarer text (upload files individually), buttons (individuelle upload buttons)
 * 
 * @param files: Objekt -> enthält unter anderem Name der File für die ein upload Feld erstellt werden soll
 * @param id: id des Genom/Replicate Tabs
 * @param studyType: 'condtion' oder 'genome'
 * @param genomes: Objekt -> Genome/Replicates
 * @param handleTabs: Funktion um Eingaben in Textfeldern des Genom Tabs anzuspeichern
 * @param saveFiles: Funktion um Dateien des drag n drop abzuspeichern
 */
function UploadFilesIndividually({ files, id, studyType, genomes, handleTabs, saveFiles }) {

  // zum Anzeigen des drag n drop fensters für den button: upload files together
  const [drop, setDrop] = useState(false);
  files.forEach((file) => {
    file.id = id;
  })


  return (
    <>
      {drop && <DropzoneGroup dropzones={files} closePopup={(e) => setDrop(!drop)} saveFiles={(e) => saveFiles(e)} />}
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