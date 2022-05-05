import React, { useState, useEffect } from 'react';
import ParameterGroup from './components/ParameterGroup';
import ParameterAllGroups from './components/ParameterAllGroups';
import UploadFilesGroup from './components/UploadFilesGroup';
import Tabs from './components/Tabs';
import './Tabs.css';
import './App.css';
import './Grid.css';

function App() {

  const [projectName, setProjectName] = useState({});
  const [parameters, setParameters] = useState([{}]);
  const [parameterPreset, setParameterPreset] = useState("default");
  const [rnaGraph, setRnaGraph] = useState(false);

  useEffect(() => {
    fetch("/parameters/").then(
      res => res.json())
      .then(
        parameters => {
          setParameters(parameters)
        })
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(parameters);
    //console.log(parameterPreset);
    //console.log(rnaGraph);
  }

  const handleParameters = (event) => {
    const name = (event.target.name).replaceAll(' ','');
    const directParent = event.target.id;
    let val;

    if(name==="TypeofStudy" || name==="clustermethod") {
      val = event.target.value;
    } else {
      val = event.target.valueAsNumber;
    }

    if(directParent === "setup") {     
      setParameters(current => (
        { ...current, 
          [directParent]: { ...current[directParent], 
                 [name]: {...current[directParent][name] , value:val}
                }
        }));   
    } else {
      setParameters(current => (
        { ...current, 
          parameterBox: { ...current.parameterBox, 
              [directParent]: {...current.parameterBox[directParent],
                  [name]: {...current.parameterBox[directParent][name], value:val}
              }
          }
        }));  
    }

    if(name==="NumberofReplicates") {
      setParameters(current => (
        { ...current, 
          parameterBox: { ...current.parameterBox, 
              Comparative: {...current.parameterBox.Comparative,
                matchingreplicates: {...current.parameterBox.Comparative.matchingreplicates, max: val}
              }
          }
        }));   
    }

    if(name==="TypeofStudy") {
      const newName = "Number of " + val.charAt(0).toUpperCase() + val.slice(1) + "s";
      setParameters(current => (
        { ...current, 
          [directParent]: { ...current[directParent], 
                 NumberofGenomes: {...current[directParent].NumberofGenomes , name:newName}
                }
        }));  
        setParameters(current => (
          { ...current, 
            parameterBox: { ...current.parameterBox, 
                Comparative: {...current.parameterBox.Comparative,
                  allowedcrossgenomeshift: {...current.parameterBox.Comparative.allowedcrossgenomeshift, name:"allowed cross-" + val + " shift"}
                }
            }
          }));   
    }
  }
 

  return (
    <div>  
      
      <header>
        <h1>TSSpredator</h1>
      </header>

      <div className='form-container'>
        <form onSubmit={handleSubmit}>
          <div>
            <label >
              <input className='element project-name' type="text" name="project-name" placeholder="Enter Project Name" onChange={(e) => setProjectName(e.target.value)}/>
            </label>

            {(typeof parameters.setup === 'undefined') ? (<p></p>) : (<ParameterGroup parameters={parameters.setup} onChange={(e) => handleParameters(e)}/>)}  
          </div>

          <br></br>
          <br></br>

          <div>
            <h3 className='element'>Upload Data</h3>
            <UploadFilesGroup files={[{"name":"Output Data Path"}, {"name":"*Alignment File*"}]}/>
            
            {(typeof parameters.setup === 'undefined') 
                ? (<p></p>) 
                : (<Tabs genomeNum={parameters.setup.NumberofGenomes.value} genome={true} 
                          label={parameters.setup.TypeofStudy.value} replicateNum={parameters.setup.NumberofReplicates.value}/>)}  

            
          </div>

          <br></br>
          <br></br>

          <div>
            <h3 className='element'>+ Parameters</h3>
            <hr></hr>

            <div className='element-row'>
              <label  className='element-row'> parameter preset
                <select value={parameterPreset} name="parameter-preset" onChange={(e) => setParameterPreset(e.target.value)}>
                  <option value="custom">custom</option>
                  <option value="very specific">very specific</option>
                  <option value="more specific">more specific</option>
                  <option value="default">default</option>
                  <option value="more sensitive">more sensitive</option>
                  <option value="very sensitive">very sensitive</option>
                </select>
              </label>

              <label  className='element-row'> 
                <input type="checkbox" name="rna-seq-graph" checked={rnaGraph} onChange={(e) => setRnaGraph(!rnaGraph)}/>
                write rna-seq graph
              </label>
            </div>

           {(typeof parameters.parameterBox === 'undefined') ? (<p></p>) : (<ParameterAllGroups parameterGroups={parameters.parameterBox} onChange={(e) => handleParameters(e)}/>)}

            <hr></hr>
          </div>
          
          <div className='element-row'>
            <button>Load</button>
            <p>or</p>
            <button>Save</button>
            <p>Configuration</p>
            <input type="submit" value="RUN"/>
          </div>

        </form>      
      </div>
    </div>
  )
}

export default App