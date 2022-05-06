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
    //console.log(parameters);
    console.log(parameterPreset);
    //console.log(rnaGraph);
  }

  const handleParameters = (event) => {
    const name = (event.target.name).replaceAll(' ','');
    const directParent = event.target.id;
    let val;

    // wenn combobox darf value keine Nummer sein
    if(name==="TypeofStudy" || name==="clustermethod") {
      val = event.target.value;
    } else {
      val = event.target.valueAsNumber;
    }

    // für setup box
    if(directParent === "setup") {     
      setParameters(current => (
        { ...current, 
          [directParent]: { ...current[directParent], 
                 [name]: {...current[directParent][name] , value:val}
                }
        }));  
    // für parameter Box (tiefere Verschachtelung)     
    } else {
      setParameters(current => (
        { ...current, 
          parameterBox: { ...current.parameterBox, 
              [directParent]: {...current.parameterBox[directParent],
                  [name]: {...current.parameterBox[directParent][name], value:val}
              }
          }
        }));  
        checkPreset(val, name);
    }

    // wenn Anzahl Replicate verändert wird, muss maximum vom Parameter 'matching replicates' angepasst werden
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

    // je nach Study Type müssen Genome/Condition Beschriftungen angepasst werden
    if(name==="TypeofStudy") {
      const newName = "Number of " + val.charAt(0).toUpperCase() + val.slice(1) + "s";
      // Number of Genomes/Conditions
      setParameters(current => (
        { ...current, 
          [directParent]: { ...current[directParent], 
                 NumberofGenomes: {...current[directParent].NumberofGenomes , name:newName}
                }
        }));  
        // allowed cross-genome/condition shift
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

  const checkPreset = (value, parameterName) => {

    const names = ['stepheight', 'stepheightreduction', 'stepfactor', 'stepfactorreduction', 'enrichmentfactor', 'processingsitefactor'];
    const values = ['default', 'more sensitive', 'more specific', 'very sensitive', 'very specific'];
    const match=[];

    if(!names.includes(parameterName)) {return;}

    values.map((val) => {
      const v = val.replace(' ','');
      // veränderter Parameter übereinstimmung mit voreinstellung?
      if(parameters.parameterBox.Prediction[parameterName][v] === value) {
        match.push(val);
      }
    })

    if(match.length === 0) {
      setParameterPreset('custom');
    } else {
      names.map((name) => {
        if(name !== parameterName) {
          match.map((mat) => {
            const v = mat.replace(' ','');
            if(parameters.parameterBox.Prediction[name][v] !== parameters.parameterBox.Prediction[name].value) {
              match.pop(mat);
            }
          })
        }
      })
    }

    if(match.length !== 0) {
      setParameterPreset(match[0]);
    }
  }

  const handleParameterPreset = (event) => {
    setParameterPreset(event.target.value);
    const preset = (event.target.value).replace(' ','');

    if(typeof parameters.parameterBox !== 'undefined' && event.target.value !== 'custom') {
      const names = ['stepheight', 'stepheightreduction', 'stepfactor', 'stepfactorreduction', 'enrichmentfactor', 'processingsitefactor'];
      names.map((name) => {
        setParameters(current => (
          { ...current, 
            parameterBox: { ...current.parameterBox, 
                Prediction: {...current.parameterBox.Prediction,
                    [name]: {...current.parameterBox.Prediction[name], value:parameters.parameterBox.Prediction[name][preset]}
                }
            }
          }));  
      })
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
            <div >
              <label> Output Data Path
                <input className='element' type="file" name="Output Data Path" />
              </label>
            </div>

            {(typeof parameters.setup === 'undefined') 
              ? (<p></p>) 
              :  <div style={parameters.setup.TypeofStudy.value==="genome" ? {display:'flex'}:{display:'none'}}>
                  <label > Alignment File
                    <input className='element' type="file" name="Alignment File" />
                  </label>
                 </div>} 

           
            
            
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
                <select value={parameterPreset} name="parameter-preset" onChange={(e) => handleParameterPreset(e)}>
                  <option value="custom">custom</option>
                  <option value="very specific">very specific</option>
                  <option value="more specific">more specific</option>
                  <option value="default">default</option>
                  <option value="more sensitive">more sensitive</option>
                  <option value="very sensitive">very sensitive</option>
                </select>
              </label>

              <label  className='element-row'> 
                <input type="checkbox" name="rna-seq-graph" checked={rnaGraph} onChange={() => setRnaGraph(!rnaGraph)}/>
                write rna-seq graph
              </label>
            </div>

           {(typeof parameters.parameterBox === 'undefined') 
                    ? (<p></p>) 
                    : (<ParameterAllGroups parameterGroups={parameters.parameterBox} onChange={(e) => handleParameters(e)}/>)}

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