import React, { useState } from "react";
import TextFieldGroup from './TextFieldGroup';
import UploadFilesIndividually from './UploadFilesIndividually';

function Tabs({genomes, genome, replicates, onChange}) {

  const [state, setState] = useState(1);

  const showTab = (index) => {
      setState(index);
  }
  
  return (
    <div className='container'>
        <div className='tab-row'>
            {Object.keys(genomes).map((g, i) => {

                return (
                  <div className={state === (i+1) ? 'tab tab-active': 'tab'} key={(i+1)} onClick={() => {showTab((i+1))}}>

                    {genome ? <input  className={state === (i+1) ? 'tab-input tab-input-active': 'tab-input'}  
                                      type="text" id={'genome' + (i+1)} name="name" placeholder={genomes[g].name}
                                      onChange={(e) => onChange(e)}/>
                            : genomes[g].name }
                  </div>
                )
               })
            }
        </div>

        <div className='tab-content'>
            {
              Object.keys(genomes).map((g, i) => {
                return (
                  <div className={state === (i+1) ? 'content content-active': 'content'} key={(i+1)}>

                    {genome ? <><TextFieldGroup fields={[{"name":"Alignment ID"}, {"name": "Output ID"}]} id={"genome" + (i+1)} onChange={(e) => onChange(e)}/>
                                <UploadFilesIndividually files={[{"name":"Genome FASTA"}, {"name":"Genome Annotation"}]} id={"genome" + (i+1)} onChange={(e) => onChange(e)}/>
                              {/*   <Tabs genomes={replicates} genome={false} onChange={(e) => onChange(e)} /> */}
                              </> :
                                <UploadFilesIndividually files={[{"name":"enriched plus"}, {"name":"enriched minus"}, {"name":"normal plus"}, {"name":"normal minus"}]}
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