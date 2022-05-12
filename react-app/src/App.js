import React, { useState, useEffect } from 'react';
import ParameterGroup from './components/ParameterGroup';
import ParameterAllGroups from './components/ParameterAllGroups';
import Tabs from './components/Tabs';
import DropzoneGroup from './components/DropzoneGroup';
import './css/Tabs.css';
import './css/App.css';
import './css/Grid.css';

function App() {

  const [projectName, setProjectName] = useState({});
  const [parameters, setParameters] = useState([{}]);
  const [parameterPreset, setParameterPreset] = useState("default");
  const [rnaGraph, setRnaGraph] = useState(false);
  const [genomes, setGenomes] = useState([{"genome1":{"name":"Genome 1", "placeholder": "Genome 1", "alignmentid":"", "outputid":"", "genomefasta":"", "genomeannotation":""}}]);
  const [replicates, setReplicates] = useState([{"genome1":[{"replicatea":{"name":"Replicate a", "enrichedforward":"", "enrichedreverse":"", "normalforward":"", "normalreverse":""}}]}]);
  // wenn neuer Genom Tab hinzugeügt wird: replicateTemplate benutzen um replicates zu updaten
  const [replicateTemplate, setReplicateTemplate] = useState([{"replicatea":{"name":"Replicate a", "enrichedforward":"", "enrichedreverse":"", "normalforward":"", "normalreverse":""}}]);
  // template für ein replicate
  const repTemplate = "{\"replicate0\":{\"name\":\"Replicate 0\", \"enrichedforward\":\"\", \"enrichedreverse\":\"\", \"normalforward\":\"\", \"normalreverse\":\"\"}}";
  const [alignmentFile, setAlignmentFile] = useState("");
  // drag n drop für alignment file
  const [drop, setDrop] = useState(false);


  /**
   * RUN Button event
   */
   const handleSubmit = (event) => {
    event.preventDefault();
    //console.log(parameters);
    //console.log(parameterPreset);
    //console.log(rnaGraph);
    //console.log(genomes);
    //console.log(replicates);
    //console.log(replicateTemplate)
    console.log(alignmentFile);
  }

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
   * Anpassung des useStates des veränderten Parameter p
   * weitere Parameter die von p abhängig sind werden auch verändert
   */
  const handleParameters = (event) => {
    const name = event.target.name;
    const directParent = event.target.id;
    let val;

    // combobox: value nicht als Nummer speichern
    if(name==="typeofstudy" || name==="clustermethod") {
      val = event.target.value;
    } else {
      val = event.target.valueAsNumber;
    }

    if(directParent === "setup") {   
      updateSetupBox(name, 'value', val);  
    } else {
      updateParameterBox(directParent, name, 'value',val);
      checkPreset(val, name);
    }

    if(name==="numberofreplicates") {
      // maximum vom Parameter 'matching replicates' anpassen
      updateParameterBox('Comparative', 'matchingreplicates','max', val);

      // Replicate Tabs anpassen
      const repLetter = String.fromCharCode(96 + val);
      const newRep = JSON.parse(repTemplate.replaceAll('0', repLetter));
    
      if(val > replicateTemplate.length) {
        // Template anpassen
        replicateTemplate.push(newRep);
        setReplicateTemplate(replicateTemplate);
        
        // Replicates für vorhandene Genome anpassen
        for (var i = 0; i < replicates.length; i++) {
         replicates[i]['genome'+(i+1)].push(newRep);
        }        
        setReplicates(replicates);

      } else if (val < replicateTemplate.length) {
        // Template anpasssen
        replicateTemplate.pop();
        setReplicateTemplate(replicateTemplate);
        // Replicates für vorhandene Genome
        for (var j = 0; j < replicates.length; j++) {
          replicates[j]['genome'+(j+1)].pop();
         }        
         setReplicates(replicates);
      }      
    }

    
    if(name==="numberofgenomes") {
      // Tab hinzugefügt: Genome Objekt hinzufügen
      const genomeName = (parameters.setup.typeofstudy.value).charAt(0).toUpperCase() + (parameters.setup.typeofstudy.value).slice(1) + " " + val;
      if(val > Object.keys(genomes).length) {
        setGenomes(current => (
          [...current, 
            {["genome"+val]: 
               {name: genomeName, placeholder: genomeName, alignmentid:"", outputid:"", genomefasta:"", genomeannotation:""}
           }]
         ))
         // Replicates: neues Genom hinzufügen
         replicates.push({["genome"+val]: [...replicateTemplate]});
         setReplicates(replicates);
        
      // Tab entfernt: Genom Objekt entfernen   
      } else if (val < Object.keys(genomes).length) {
        genomes.pop();
        setGenomes(genomes);
        // Replicates: Genom entfernen
        replicates.pop();
        setReplicates(replicates);
      }
    }

    // Genome/Condition Beschriftungen anpassen
    if(name==="typeofstudy") {
      const newName = "Number of " + val.charAt(0).toUpperCase() + val.slice(1) + "s";
      // Number of Genomes/Conditions
      updateSetupBox('numberofgenomes', 'name', newName);

      // Genome/Condition Tabs
      genomes.map((g,i) => (
        g['genome'+(i+1)].placeholder = val.charAt(0).toUpperCase() + val.slice(1) + " " + (i+1)
      ))
      setGenomes([...genomes]);
     
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
  const updateSetupBox =(node, element, value) => {
    setParameters(current => (
      { ...current, 
        setup: { ...current.setup, 
               [node]: {...current.setup[node] , [element]:value}
              }
      }));  
  }

  /**
   * überprüft ob ein Parameter preset mit den aktuellen Parameter Werten vorliegt
   */
  const checkPreset = (value, parameterName) => {
    const names = ['stepheight', 'stepheightreduction', 'stepfactor', 'stepfactorreduction', 'enrichmentfactor', 'processingsitefactor'];
    const values = ['default', 'more sensitive', 'more specific', 'very sensitive', 'very specific'];
    const match=[];

    if(!names.includes(parameterName)) {return;}

    values.forEach((val) => {
      const v = val.replace(' ','')
      // veränderter Parameter übereinstimmung mit voreinstellung?
      if(parameters.parameterBox.Prediction[parameterName][v] === value) {
        match.push(val);
      }
    })

    // restlichen Parameter überprüfen
    if(match.length === 0) {
      setParameterPreset('custom');
    } else {
      names.forEach((name) => {
        if(name !== parameterName) {
          match.forEach((mat) => {
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
      names.forEach((name) => {
        updateParameterBox('Prediction', name, 'value', parameters.parameterBox.Prediction[name][preset]);
      })
    } 
  } 

/**
 * speichert Eingaben in Textfeldern vom Genome Tab ab
 */
  const handleTabs = (event) => {
    
    const name = event.target.name;
    const value = event.target.value;
    const id = parseInt(event.target.id);

    genomes[id]['genome'+(id+1)][name] = value;
    setGenomes([...genomes]);
  }

  /**
   * speichert Dateien vom drag n drop file upload in genome/replicate ab
   */
  const saveFiles = (event) => {
        
    if(typeof event.files.genomefasta !== 'undefined') {
      saveGenomes(event.files.genomefasta.id, event.files.genomefasta.file, 'genomefasta');
    }
    if(typeof event.files.genomeannotation !== 'undefined') {
      saveGenomes(event.files.genomeannotation.id, event.files.genomeannotation.file, 'genomeannotation');
    }

    if(typeof event.files.enrichedforward !== 'undefined') {
      saveReplicates(event.files.enrichedforward.id[0], event.files.enrichedforward.id[1], event.files.enrichedforward.file, 'enrichedforward');
    }
    if(typeof event.files.enrichedreverse !== 'undefined') {
      saveReplicates(event.files.enrichedreverse.id[0], event.files.enrichedreverse.id[1], event.files.enrichedreverse.file, 'enrichedreverse');
    }
    if(typeof event.files.normalforward !== 'undefined') {
      saveReplicates(event.files.normalforward.id[0], event.files.normalforward.id[1], event.files.normalforward.file, 'normalforward');
    }
    if(typeof event.files.normalreverse !== 'undefined') {
      saveReplicates(event.files.normalreverse.id[0], event.files.normalreverse.id[1], event.files.normalreverse.file, 'normalreverse');
    }
     
    setGenomes([...genomes]);  
    setReplicates([...replicates]);
  }


  /**
   * speichert Datei im Genom Tab ab
   */
  const saveGenomes = (gId, file, node) => {
    genomes[gId]['genome'+(gId+1)][node] = file;
  }

  /**
   * speichert Datei im Replicate Tab ab
   * gId: Genom Id, an welcher Stelle im replicate array
   * rId: Replicate Id
   */
  const saveReplicates = (gId, rId, file, node) => {
    const replicate ='replicate' + String.fromCharCode(97 + rId);

    let newValue = {...replicates[gId]['genome'+(gId+1)][rId][replicate]};
    newValue[node] = file;
    replicates[gId]['genome'+(gId+1)][rId] = {[replicate]: newValue};
  }


  return (
    <div>  

      {drop && <DropzoneGroup dropzones={[{ "name": "Alignment File", "value": "Alignment File" }]} closePopup={(e) => setDrop(!drop)} 
                              saveFiles={(e) => setAlignmentFile(e.files.alignmentfile.file)} />}

      <header>
        <h1>TSSpredator</h1>
      </header>

      <div className='form-container'>
          <div>
            <label >
              <input className='element project-name' type="text" name="project-name" placeholder="Enter Project Name" onChange={(e) => setProjectName(e.target.value)}/>
            </label>
            {(typeof parameters.setup === 'undefined') ? (<p></p>) : (<ParameterGroup parameters={parameters.setup} onChange={(e) => handleParameters(e)}/>)}  
          </div>

          <div>
            <h3 className='element'>Upload Data</h3>

            {(typeof parameters.setup === 'undefined') 
              ? (<p></p>) 
              :  <>
                  <div style={parameters.setup.typeofstudy.value==="genome" ? {display:'flex'}:{display:'none'}}>
                    <label > Alignment File
                      <button className='element' type="button" name="Alignment File" onClick={() => setDrop(!drop)}>Upload File</button>
                      {alignmentFile.path}
                    </label>
                  </div>
                  <Tabs genomes={genomes} genome={true} replicates={replicates} studyType={parameters.setup.typeofstudy.value} 
                        handleTabs={(e) => handleTabs(e)} saveFiles={(e) => saveFiles(e)}/> </>
            } 
          </div>

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
            <button type="button" onClick={(e) => handleSubmit(e)}>RUN</button>
          </div>

      </div> 
    </div>
  )
}

export default App