import React, { useState } from "react";
import TextFieldGroup from './TextFieldGroup';
import UploadFilesIndividually from './UploadFilesIndividually';

function Tabs({genomes, genome, replicates, whichGenome, studyType, onChange}) {

  const [state, setState] = useState(1);

  const showTab = (index) => {
      setState(index);
  }
 
  return (
    <div className='container'>
        <div className='tab-row'>

          {genomes.map((g,i) => {                                
              return (
                <div className={state === (i+1) ? 'tab tab-active': 'tab'} key={(i+1)} onClick={() => {showTab((i+1))}}>

                  {genome ? <input  className={state === (i+1) ? 'tab-input tab-input-active': 'tab-input'}  
                                    type="text" id={i} name="name" placeholder={genomes[i]['genome'+(i+1)].placeholder}
                                    onChange={(e) => onChange(e)}/>
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

                    {genome ? <><TextFieldGroup fields={[{"name":"Alignment ID"}, {"name": "Output ID"}]} studyType={studyType} id={i} onChange={(e) => onChange(e)}/>
                                <UploadFilesIndividually files={[{"name":"Genome FASTA"}, {"name":"Genome Annotation"}]} studyType={studyType} id={i} onChange={(e) => onChange(e)}/>
                                <Tabs genomes={replicates[i]['genome'+(i+1)]} genome={false} whichGenome={i} onChange={(e) => onChange(e)} /> 
                              </> :
                                <UploadFilesIndividually files={[{"name":"enriched plus"}, {"name":"enriched minus"}, {"name":"normal plus"}, {"name":"normal minus"}]}
                                                         id={[whichGenome, i]}
                                                         onChange={(e) => onChange(e)} />}  
                  </div>
                )
               })
            }
        </div>
    </div>
  )
}

export default Tabs