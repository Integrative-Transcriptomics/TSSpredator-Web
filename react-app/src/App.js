import React, { useState, useEffect } from 'react';
import ParameterGroup from './components/ParameterGroup';
import ParameterAllGroups from './components/ParameterAllGroups';
import Tabs from './components/Tabs';
import './Tabs.css';
import './App.css';
import './Grid.css';

function App() {

  const [projectName, setProjectName] = useState({});
  const [parameters, setParameters] = useState([{}]);
  const [parameterPreset, setParameterPreset] = useState("default");
  const [rnaGraph, setRnaGraph] = useState(false);
  const [genomes, setGenomes] = useState({"genome1":{"name":"Genome 1", "alignmentid":"", "outputid":"", "genomefasta":"", "genomeannotation":""}});
  const [replicates, setReplicates] = useState({"genome1":{"replicate1":{"name":"Replicate a", "enrichedplus":"", "enrichedminus":"", "normalplus":"", "normalminus":""}}})

  /**
   * holt die Parameterwerte beim Start der Seite vom Server
   */
  useEffect(() => {
    fetch("/parameters/").then(
      res => res.json())
      .then(
        parameters => {
          setParameters(parameters)
        })
  }, []);

  /**
   * GenomTabs dynamisch anpassen
   */
  useEffect(() => {
    if(typeof parameters.setup !== 'undefined') {
      setGenomes(current => (
       {...current,
          ["genome"+parameters.setup.NumberofGenomes.value]: 
            {name: ["Genome "+parameters.setup.NumberofGenomes.value], alignmentid:"", outputid:"", genomefasta:"", genomeannotation:""}
        }
      ))
    }
  }, [parameters])

  /**
   * ReplicateTabs dynamisch anpassen
   
   useEffect(() => {
    if(typeof parameters.setup !== 'undefined') {
      setGenomes(current => (
        {...current,
          ["genome"+parameters.setup.NumberofReplicates.value]: {
          ["replicate"]: 
            {name: ["Replicate "+ String.fromCharCode(97 + parameters.setup.NumberofReplicates.value)], 
            enrichedplus:"", enrichedminus:"", normalplus:"", normalminus:""}
          }
            
        }
      ))
      console.log(parameters.setup.NumberofGenomes.value);
    }
  }, [parameters]) */

  /**
   * RUN Button event
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    //console.log(parameters);
    //console.log(parameterPreset);
    //console.log(rnaGraph);
    console.log(genomes);
  }

  /**
   * Wenn ein Parameter verändert wird, wird der useState von setParameters angepass
   * Wenn der Parameter andere Parameter beeinflusst wird des auch geändert
   */
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

    if(directParent === "setup") {   
      updateSetupBox(directParent, name, 'value', val);  
    } else {
      updateParameterBox(directParent, name, 'value',val);
      checkPreset(val, name);
    }

    // wenn Anzahl Replicate verändert wird, muss maximum vom Parameter 'matching replicates' angepasst werden
    if(name==="NumberofReplicates") {
      updateParameterBox('Comparative', 'matchingreplicates','max', val);
    }

    // je nach Study Type müssen Genome/Condition Beschriftungen angepasst werden
    if(name==="TypeofStudy") {
      const newName = "Number of " + val.charAt(0).toUpperCase() + val.slice(1) + "s";
      // Number of Genomes/Conditions
      updateSetupBox(directParent, 'NumberofGenomes', 'name', newName);
        
      // allowed cross-genome/condition shift
      updateParameterBox('Comparative', 'allowedcrossgenomeshift', 'name', "allowed cross-" + val + " shift");
    }
  }

  /**
   * update Wert eines Parameters in der parameter box
   */
  const updateParameterBox =(parent, node, element, value) => {
    setParameters(current => (
      { ...current, 
        parameterBox: { ...current.parameterBox, 
            [parent]: {...current.parameterBox[parent],
                [node]: {...current.parameterBox[parent][node], [element]:value}
            }
        }
      }));  
  }

  /**
   * update Wert eines Parameters in der setup box
   */
  const updateSetupBox =(parent, node, element, value) => {
    setParameters(current => (
      { ...current, 
        [parent]: { ...current[parent], 
               [node]: {...current[parent][node] , [element]:value}
              }
      }));  
  }

  /**
   * wenn Parameter verändert wird, wird überprüft ob die Werte der Parameter einem
   * parameter preset entsprechen und dieser wird dann abgeändert
   */
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

    // restlichen Parameter überprüfen
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

  /**
   * passt Parameter entsprechend des ausgewählten parameter presets an
   */
  const handleParameterPreset = (event) => {
    setParameterPreset(event.target.value);
    const preset = (event.target.value).replace(' ','');

    if(typeof parameters.parameterBox !== 'undefined' && event.target.value !== 'custom') {
      const names = ['stepheight', 'stepheightreduction', 'stepfactor', 'stepfactorreduction', 'enrichmentfactor', 'processingsitefactor'];
      names.map((name) => {
        updateParameterBox('Prediction', name, 'value', parameters.parameterBox.Prediction[name][preset]);
      })
    } 
  } 


  const handleTabs = (event) => {
    
    const name = event.target.name;
    const id = event.target.id;
    let value;
  
    if(name==="name" || name==="alignmentid" || name==="outputid") {
      value = event.target.value;
    } else {
      value = event.target.files[0];
    }

    setGenomes(current => ({
      ...current,
      [id]:{...current[id], 
           [name]: value}

    }))
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
                : (<Tabs genomes={genomes} genome={true} 
                         replicates={replicates}
                          onChange={(e) => handleTabs(e)}/>)}  

            
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