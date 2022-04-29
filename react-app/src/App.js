import React, { useState, useEffect } from 'react';
import Combobox from "react-widgets/Combobox";
import TabList from "react-tab-list";
import ParameterGroup from './components/ParameterGroup';
import ParameterAllGroups from './components/ParameterAllGroups';
import UploadFilesGroup from './components/UploadFilesGroup';
import UploadFilesIndividually from './components/UploadFilesIndividually';
import TextFieldGroup from './components/TextFieldGroup';

function App() {

  const [projectName, setProjectName] = useState();
  const [num, setNum] = React.useState(1); // initial für jeden spinner benutzt
  const[parameters, setParameters] = useState({});


  return (
    <div>
      <header className='header' style={{backgroundColor:'black'}}>
        <h1 style={{color:'white'}}>TSSpredator</h1>
      </header>

      <form>
        <div className='setup-box'>
          <label>
            <input type="text" name="project-name" placeholder="Enter Project Name"/>
          </label>

          <label  style={{display:'flex',flexDirection:'row'}}> Type of Study
            <Combobox defaultValue="Copmarison of different strains/species" data={["Copmarison of different strains/species", "Comparison of different conditions"]}/>
          </label>

          <ParameterGroup parameters={[{"name": "Number of *Genomes*", "min":0, "max":10, "step":1, "value":1},
                                       {"name": "Number of Replicates", "min":0, "max":10, "step":1, "value":1}]}/>

        </div>

        <br></br>
        <br></br>

        <div className='upload-data-box' style={{display:'flex',flexDirection:'column'}}>

          <h3>Upload Data</h3>

          <UploadFilesGroup files={[{"name":"Output Data Path"}, {"name":"Alignment File"}]}/>

          <label>
            <input type="text" name="genome-1" placeholder="Genome 1"/>
            <input type="text" name="genome-2" placeholder="Genome 2"/>
            <hr></hr>
          </label>

          <TextFieldGroup fields={[{"name":"Alignment ID"}, {"name": "Output ID"}]} />

          <UploadFilesIndividually files={[{"name":"Genome FASTA"}, {"name":"Genome Annotation"}]}/>
            
          <div className='replicates'>
            <label>
              <input type="text" name="replicate-1" value="Replicate 1"/>
              <input type="text" name="replicate-2" value="Replicate 2"/>
            </label>
          </div>

          <UploadFilesIndividually files={[{"name":"enriched plus"}, {"name":"enriched minus"}, {"name":"normal plus"}, {"name":"normal minus"}]}/>
          
        </div>

        <br></br>
        <br></br>

        <div className='parameters'>
          <h3>+ Parameters</h3>
          <hr></hr>

          <div style={{display:'flex',flexDirection:'row'}}>
            <label  style={{display:'flex',flexDirection:'row'}}> parameter preset
              <Combobox defaultValue="default" data={["custom", "very specific", "more specific", "default", "more sensitive", "very sensitive"]}/>
            </label>

            <label  style={{display:'flex',flexDirection:'row'}}> 
              <input type="checkbox" name="rna-seq-graph"/>
              write rna-seq graph
            </label>
          </div>


          <ParameterAllGroups parameterGroups={[{"name":"prediction", "parameters": [{"name": "step height", "min":0, "max":10, "step":1, "value":1}, {"name": "step height reduction", "min":0, "max":10, "step":2, "value":2}]},
                                                {"name":"normalization", "parameters": [{"name": "normalization percentile", "min":0, "max":10, "step":1, "value":1}, {"name": "enrichment normalization percentile", "min":0, "max":10, "step":2, "value":2}]}]}/>
                                                

        </div>
        

        <div style={{display:'flex',flexDirection:'row'}}>
          <button>Load</button>
          <p>or</p>
          <button>Save</button>
          <p>Configuration</p>
          <button>RUN</button>
        </div>

      </form>      
    </div>
  )
}

export default App