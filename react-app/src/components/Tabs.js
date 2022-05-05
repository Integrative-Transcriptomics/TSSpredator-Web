import React, { useState } from "react";
import TextFieldGroup from './TextFieldGroup';
import UploadFilesIndividually from './UploadFilesIndividually';

function Tabs({genomeNum, genome, replicateNum, label}) {

  const [state, setState] = useState(1);

  const showTab = (index) => {
      setState(index);
  }

  return (
    
    <div className='container'>
        
        <div className='tab-row'>
            {
               [...Array(genomeNum)].map((x, i) => {
                return (
                  <div className={state === (i+1) ? 'tab tab-active': 'tab'} key={(i+1)} onClick={() => {showTab((i+1))}}>
                    {genome ? <input  className={state === (i+1) ? 'tab-input tab-input-active': 'tab-input'}  
                                      type="text" name={'genome-' + (i+1)} placeholder={label.charAt(0).toUpperCase() + label.slice(1) + " "+ (i+1)}/>
                            : ("Replicate " + String.fromCharCode(97 + i)) }
                  </div>
                )
               })
            }
        </div>

        <div className='tab-content'>
            {
               [...Array(genomeNum)].map((x, i) => {
                return (
                  <div className={state === (i+1) ? 'content content-active': 'content'} key={(i+1)}>

                    {genome ? <><TextFieldGroup fields={[{"name":"Alignment ID"}, {"name": "Output ID"}]} />
                                <UploadFilesIndividually files={[{"name":"Genome FASTA"}, {"name":"Genome Annotation"}]}/>
                                <Tabs genomeNum={replicateNum} genome={false} />
                              </> :
                                <UploadFilesIndividually files={[{"name":"enriched plus"}, {"name":"enriched minus"}, {"name":"normal plus"}, {"name":"normal minus"}]}/>}  
                  </div>
                )
               })
            }
        </div>
    </div>
  )
}

export default Tabs