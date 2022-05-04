import React, { useState, useEffect } from 'react';
import Combobox from "react-widgets/Combobox";
import ParameterGroup from './components/ParameterGroup';
import ParameterAllGroups from './components/ParameterAllGroups';
import UploadFilesGroup from './components/UploadFilesGroup';
import Tabs from './components/Tabs';
import './Tabs.css';
import './App.css';
import './Grid.css';

function App() {

  const [projectName, setProjectName] = useState({});
  const [num, setNum] = React.useState(1); // initial für jeden spinner benutzt
  const [parameters, setParameters] = useState([{}]);

  useEffect(() => {
    fetch("/parameters/").then(
      res => res.json())
      .then(
        parameters => {
          setParameters(parameters)
        })
  }, []);


  return (
    <div>  
      
      <header>
        <h1>TSSpredator</h1>
      </header>

      <div className='form-container'>
        <form>
          <div>
            <label >
              <input className='element project-name' type="text" name="project-name" placeholder="Enter Project Name"/>
            </label>

            {(typeof parameters.setup === 'undefined') ? (<p></p>) : (<ParameterGroup parameters={parameters.setup}/>)}  
          </div>

          <br></br>
          <br></br>

          <div>
            <h3 className='element'>Upload Data</h3>
            <UploadFilesGroup files={[{"name":"Output Data Path"}, {"name":"*Alignment File*"}]}/>
            <Tabs genomeNum={5} genome={true} replicateNum={2}/>
          </div>

          <br></br>
          <br></br>

          <div>
            <h3 className='element'>+ Parameters</h3>
            <hr></hr>

            <div className='element-row'>
              <label  className='element-row'> parameter preset
                <Combobox defaultValue="default" data={["custom", "very specific", "more specific", "default", "more sensitive", "very sensitive"]}/>
              </label>

              <label  className='element-row'> 
                <input type="checkbox" name="rna-seq-graph"/>
                write rna-seq graph
              </label>
            </div>

            {(typeof parameters.parameterBox === 'undefined') ? (<p></p>) : (<ParameterAllGroups parameterGroups={parameters.parameterBox}/>)} 

            <hr></hr>
          </div>
          
          <div className='element-row'>
            <button>Load</button>
            <p>or</p>
            <button>Save</button>
            <p>Configuration</p>
            <button type="submit">RUN</button>
          </div>

        </form>      
      </div>
    </div>
  )
}

export default App