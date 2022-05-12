import React from 'react';
import UploadFile from './UploadFile';


/** erstellt Komponente die die Gruppe an individuellen upload buttons für Elemente enthält
 * 
 * @param files: Objekt -> enthält unter anderem Name der File für die ein upload Feld erstellt werden soll
 * @param id: id des Genom/Replicate Tabs
 * @param studyType: 'condtion' oder 'genome'
 * @param genomes: Objekt -> Genome/Replicates
 * @param handleTabs: Funktion um Eingaben in Textfeldern des Genom Tabs anzuspeichern
 * @param saveFiles: Funktion um Dateien des drag n drop abzuspeichern
 */
function UploadFilesGroup({ files, id, studyType, genomes, handleTabs, saveFiles }) {
  return (

    files.map((file, i) => {
      return <UploadFile file={file} key={i} id={id} studyType={studyType} genomes={genomes} handleTabs={(e) => handleTabs(e)} saveFiles={(e) => saveFiles(e)} />
    })
  );
}

export default UploadFilesGroup