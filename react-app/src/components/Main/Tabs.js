import React, { useState } from "react";
import TextFieldGroup from './TextFieldGroup';
import UploadFilesIndividually from './UploadFilesIndividually';
import PopupWindow from "./PopupWindow";

/** creates the genome and replicate tabs
 * 
 * @param genomes: array with all genomes that need a tab -> genome saved as Objekt
 * @param genome: true <=> create genome tab, false <=> create replicate tab
 * @param replicates: array with all replicates that need a tab -> replicate saved as Objekt
 * @param whichGenome: for creating repicate tab -> genome index: in which genome tab the replicate is found
 * @param studyType: 'condition' or 'genome'
 * @param handleTabs: function to handle input in text fields for the genome tabs
 * @param numRep: number of replicates
 * @param saveFiles: function to handle multiple uploaded files
 * @param saveIndividualFile: saves an individual file
 * @param saveAnnotationFile: saves annotation files
 * @param showName: true <-> show name of genome tab
 */

function Tabs({ genomes, genome, replicates, whichGenome, studyType, handleTabs, numRep, saveFiles, saveIndividualFile, saveAnnotationFile, showName }) {

  // current active tab
  const [state, setState] = useState(1);

  // popup windows to upload all files together
  const [popup, setPopup] = useState(false);

  // current tab is last tab and then tab number is decreased
  if (state > genomes.length) {
    setState(1)
  }

  let disabled = false;
  if (studyType === 'condition' && state > 1) {
    disabled = true;
  }

  let tabClass;

  // names of the files that need to be uploaded
  let fileNames;
  if (genome) {
    tabClass = 'tab'
    fileNames = [{ "name": "Genome FASTA", "value": "Genome FASTA", "tooltip": "FASTA/multiFASTA file containing the genomic sequence of this genome." },
    { "name": "Genome Annotation", "value": "Genome Annotation", "tooltip": "Folder containing all GFF/GTF genomic annotation files for this genome." }]
  } else {
    tabClass = 'tab-rep'
    fileNames = [{ "name": "enriched forward", "value": "enriched forward", "tooltip": "Graph file containing the RNA-seq expression graph for the forward strand from the 5' enrichment library." },
    { "name": "enriched reverse", "value": "enriched reverse", "tooltip": "Graph file containing the RNA-seq expression graph for the reverse strand from the 5' enrichment library." },
    { "name": "normal forward", "value": "normal forward", "tooltip": "Graph file containing the RNA-seq expression graph for the forward strand from library without 5' enrichment." },
    { "name": "normal reverse", "value": "normal reverse", "tooltip": "Graph file containing the RNA-seq expression graph for the reverse strand from library without 5' enrichment." }]
  }

  return (
    <>
      {popup && <PopupWindow closePopup={(e) => setPopup(!popup)} numRep={numRep} gIdx={state} disabled={disabled}
        saveAllFiles={(g, ef, er, nf, nr) => saveFiles(g, ef, er, nf, nr, state - 1)} />}

      <div className='container'>
        <div className='tab-row'>
          {genome ? <></> : <div className='left-line'></div>}
          {genomes.map((g, i) => {
            var val = "";
            if (showName) {
              val = genomes[i]['genome' + (i + 1)].name;
            }
            // tolltip or not
            if (genome) {
              return (
                <div className={state === (i + 1) ? tabClass + ' tab-active' : tabClass} key={(i + 1)} onClick={() => { setState((i + 1)) }}
                  data-tabs-title="Brief unique name for this strain/condition. Special characters (including spaces) should be avoided.">
                  {genome ? <input className={state === (i + 1) ? 'tab-input tab-input-active' : 'tab-input'} type="text" id={i} name="name" value={val}
                            placeholder={genomes[i]['genome' + (i + 1)].placeholder} onChange={(e) => handleTabs(e)} />
                          : "Replicate " + String.fromCharCode(97 + i)}
                </div>
              )
            } else {
              return (
                <div className={state === (i + 1) ? tabClass + ' tab-active' : tabClass} key={(i + 1)} onClick={() => { setState((i + 1)) }}>
                  {genome ? <input className={state === (i + 1) ? 'tab-input tab-input-active' : 'tab-input'} type="text" id={i} name="name" value={val}
                            placeholder={genomes[i]['genome' + (i + 1)].placeholder} onChange={(e) => handleTabs(e)} />
                          : "Replicate " + String.fromCharCode(97 + i)}
                </div>
              )
            }
          })}

        </div>

        <div className={genome ? 'tab-content content-border' : 'tab-content'}>
          {genome ? <div className={genomes.length > 8 ? "line line-top line" + (genomes.length % 8) : "line line" + (genomes.length % 8)}></div>
            : <div className={"line line-rep rep-line" + (genomes.length % 7)}></div>
          }

          {genomes.map((g, i) => {

            return (
              <div className={state === (i + 1) ? 'content content-active' : 'content'} key={(i + 1)}>

                {genome ? <><TextFieldGroup fields={[{ "name": "Alignment ID", "value": g['genome' + (i + 1)]['alignmentid'] }, 
                                                      { "name": "Output ID", "value": g['genome' + (i + 1)]['outputid']}]} 
                                            studyType={studyType} id={i} handleTabs={(e) => handleTabs(e)}/>
                  <button className="button all-files" type='button' onClick={() => setPopup(!popup)}>Upload Files together</button>

                  <UploadFilesIndividually files={fileNames} studyType={studyType} id={i} genomes={genomes} handleTabs={(e) => handleTabs(e)}
                    saveIndividualFile={(e) => saveIndividualFile(e)} saveAnnotationFile={(e) => saveAnnotationFile(e)} />

                  <Tabs genomes={replicates[i]['genome' + (i + 1)]} genome={false} whichGenome={i} handleTabs={(e) => handleTabs(e)}
                    saveIndividualFile={(e) => saveIndividualFile(e)} saveAnnotationFile={(e) => saveAnnotationFile(e)} />
                </>
                  : <UploadFilesIndividually files={fileNames} id={[whichGenome, i]} genomes={genomes} handleTabs={(e) => handleTabs(e)}
                    saveIndividualFile={(e) => saveIndividualFile(e)} saveAnnotationFile={(e) => saveAnnotationFile(e)} />}
              </div>
            )
          })
          }
        </div>
      </div>
    </>
  )
}

export default Tabs