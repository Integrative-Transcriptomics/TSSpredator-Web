import React, { useState } from "react";
import TextFieldGroup from './TextFieldGroup';
import UploadFilesIndividually from './UploadFilesIndividually';

function Tabs({genomes, genome, replicates, whichGenome, studyType, handleTabs, saveFiles}) {

  const [state, setState] = useState(1);
  
  const showTab = (index) => {
      setState(index);
  }

  let dropzones;
  if(genome) {
    dropzones= [{"name":"Genome FASTA", "value":"Genome FASTA", 'id':'id1'}, {"name":"Genome Annotation", "value":"Genome Annotation",'id':'id2'}]
  } else {
    dropzones=[{"name":"enriched forward", "value":"enriched forward", 'id':'id1'}, {"name":"enriched reverse", "value":"enriched reverse", 'id':'id2'}, 
              {"name":"normal forward", "value":"normal forward", 'id':'id3'}, {"name":"normal reverse", "value":"normal reverse", 'id':'id4'}]
  }
 
  return (
    <>
    <div className='container'>
        <div className='tab-row'>

          {genomes.map((g,i) => {                                
              return (
                <div className={state === (i+1) ? 'tab tab-active': 'tab'} key={(i+1)} onClick={() => {showTab((i+1))}}>

                  {genome ? <input  className={state === (i+1) ? 'tab-input tab-input-active': 'tab-input'}  
                                    type="text" id={i} name="name" placeholder={genomes[i]['genome'+(i+1)].placeholder}
                                    onChange={(e) => handleTabs(e)}/>
                          : "Replicate " + String.fromCharCode(97 + i)}
                </div>
              )
          })}
        
        </div>

        <div className='tab-content'>
            {
              genomes.map((g,i) => {
                return (
                  <div className={state === (i+1) ? 'content content-active': 'content'} key={(i+1)}>

                    {genome ? <><TextFieldGroup fields={[{"name":"Alignment ID"}, {"name":"Output ID"}]} studyType={studyType} id={i} onChange={(e) => handleTabs(e)}/>
                                <UploadFilesIndividually files={dropzones} studyType={studyType} id={i} genomes={genomes}
                                                          handleTabs={(e) => handleTabs(e)} saveFiles={(e) => saveFiles(e)}/>
                               {/*  <Tabs genomes={replicates[i]['genome'+(i+1)]} genome={false} whichGenome={i} onChange={(e) => onChange(e)} uploadFiles={() => setDrop(!drop)} /> */}
                              </> :
                                <UploadFilesIndividually files={dropzones}
                                                         id={[whichGenome, i]}
                                                         onChange={(e) => handleTabs(e)}/>}  
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