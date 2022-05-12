import React, { useState } from "react";
import TextFieldGroup from './TextFieldGroup';
import UploadFilesIndividually from './UploadFilesIndividually';

/** erzeugt die Genom Tabs und replicate Tabs
 * 
 * @param genomes: Array an Genomen für die ein Tab erstellt werden soll -> Genom als Objekt gespeichert
 * @param genome: true <=> wenn ein Genom Tab erstellt werden soll, false <=> wenn replicate Tab erstellt werden soll
 * @param replicates: Array an replicates für die ein Tab erstellt werden soll -> Replicate als Objekt gepseichert
 * @param whichGenome: wenn replicate Tab erstellt wird -> Genomindex: also in welchem Genom Tab die replicates sich befinden
 * @param studyType: 'condition' oder 'genome'
 * @param handleTabs: Funktion um Eingaben in Textfeldern des Genom Tabs anzuspeichern
 * @param saveFiles: Funktion um Dateien des drag n drop abzuspeichern
 * @returns 
 */

function Tabs({ genomes, genome, replicates, whichGenome, studyType, handleTabs, saveFiles }) {

  // dynamisch Tabs hinzufügen/entfernen
  const [state, setState] = useState(1);
  // öffne Tab auf den man geklickt hat
  const showTab = (index) => {
    setState(index);
  }

  // Namen der Dateien die pro Tab hochgeladen werden müssen
  let dropzones;
  if (genome) {
    dropzones = [{ "name": "Genome FASTA", "value": "Genome FASTA" }, { "name": "Genome Annotation", "value": "Genome Annotation" }]
  } else {
    dropzones = [{ "name": "enriched forward", "value": "enriched forward" }, { "name": "enriched reverse", "value": "enriched reverse" },
    { "name": "normal forward", "value": "normal forward" }, { "name": "normal reverse", "value": "normal reverse" }]
  }

  return (
    <div className='container'>
      <div className='tab-row'>
        {genomes.map((g, i) => {
          return (
            <div className={state === (i + 1) ? 'tab tab-active' : 'tab'} key={(i + 1)} onClick={() => { showTab((i + 1)) }}>

              {genome ? <input className={state === (i + 1) ? 'tab-input tab-input-active' : 'tab-input'} type="text" id={i} name="name" 
                                placeholder={genomes[i]['genome' + (i + 1)].placeholder} onChange={(e) => handleTabs(e)} />
                      : "Replicate " + String.fromCharCode(97 + i)}
            </div>
          )})
        }
      </div>

      <div className='tab-content'>
        {genomes.map((g, i) => {
          return (
            <div className={state === (i + 1) ? 'content content-active' : 'content'} key={(i + 1)}>

              {genome ? <><TextFieldGroup fields={[{ "name": "Alignment ID" }, { "name": "Output ID" }]} studyType={studyType} id={i} handleTabs={(e) => handleTabs(e)} />
                          <UploadFilesIndividually files={dropzones} studyType={studyType} id={i} genomes={genomes} handleTabs={(e) => handleTabs(e)} 
                                                    saveFiles={(e) => saveFiles(e)} />
                          <Tabs genomes={replicates[i]['genome' + (i + 1)]} genome={false} whichGenome={i} handleTabs={(e) => handleTabs(e)} 
                                saveFiles={(e) => saveFiles(e)} />
                        </> 
                      : <UploadFilesIndividually files={dropzones} id={[whichGenome, i]} genomes={genomes} handleTabs={(e) => handleTabs(e)} 
                                                  saveFiles={(e) => saveFiles(e)} />}
            </div>
          )})
        }
      </div>
    </div>
  )
}

export default Tabs