import React, { useState, useEffect } from "react";
import ParameterGroup from "./ParameterGroup";
import ParameterAllGroups from "./ParameterAllGroups";
import Tabs from "./Tabs";
import ClipLoader from "react-spinners/ClipLoader";
import "../../css/Tabs.css";
import "../../css/App.css";
import "../../css/Grid.css";
import "../../css/DragDrop.css";


function FormConfig({
    projectName,
    setProjectName,
    parameters,
    handleParameters,
    saveAlignmentFile,
    alignmentFile,
    genomes,
    replicates,
    handleTabs,
    numRep,
    saveFiles,
    saveIndividualFile,
    saveAnnotationFile,
    showGName,
    multiFasta,
    parameterPreset,
    handleParameterPreset,
    rnaGraph,
    setRnaGraph,
    setConfHeader,
    setText,
    setConfPopup,
    saveConfigFile,
    loading,
    handleSubmit
}){
     // open/close parameters
    const [showParam, setShowParam] = useState(false);
    // // checkbox
    return <div className='form-container'>
      <div>
        <label>
          <input
            className='project-name'
            type='text'
            name='project-name'
            placeholder='Enter Project Name'
            defaultValue={projectName}
            onChange={(e) => setProjectName(e.target.value)} />
        </label>
        {!parameters.setup ? (
          <p></p>
        ) : (
          <ParameterGroup
            parameters={parameters.setup}
            grid={false}
            onChange={(e) => handleParameters(e)} />
        )}
      </div>
  
      <div>
        <h3 className='header'>Data Upload:</h3>
        <div className='margin-left'>
          {!parameters.setup  ? (
            <></>
          ) : (
            <>
              {parameters.setup.typeofstudy.value === "genome" ? (
                <div
                  className={parameters.setup.typeofstudy.value === "genome"
                    ? "file-box-align"
                    : "file-box-align vis-hidden"}
                  title='Select the xmfa alignment file containing the aligned genomes.'
                >
                  <p className='file-row'>Alignment File</p>
                  <label className='element-row file-row' htmlFor='alignment-file'>
                    <input
                      className='element hidden'
                      type='file'
                      id='alignment-file'
                      onChange={(e) => saveAlignmentFile(e)} />
                    <p className='button'>Select File</p>
                    {alignmentFile.length <= 0 ? (
                      <p className='file-name'>No file selected.</p>
                    ) : (
                      <p className='file-name'>{alignmentFile.name}</p>
                    )}
                  </label>
                </div>
              ) : (
                <></>
              )}
              <Tabs
                genomes={genomes}
                genome={true}
                replicates={replicates}
                studyType={parameters.setup.typeofstudy.value}
                handleTabs={(e) => handleTabs(e)}
                numRep={numRep}
                saveFiles={(g, ef, er, nf, nr, idx) => saveFiles(g, ef, er, nf, nr, idx)}
                saveIndividualFile={(e) => saveIndividualFile(e)}
                saveAnnotationFile={(e) => saveAnnotationFile(e)}
                showName={showGName}
                multiFasta={multiFasta} />
            </>
          )}
        </div>
      </div>
  
      <div>
        <h3 className='header click-param' onClick={(e) => setShowParam(!showParam)}>
          {showParam ? "-" : "+"} Parameters
        </h3>
  
        <div className={showParam ? "show margin-left file-column" : "hidden"}>
          <div className='element-row'>
            <label className='element preset-label' htmlFor='preset'>
              {" "}
              parameter preset
            </label>
            <select
              className='param-preset'
              value={parameterPreset}
              name='parameter-preset'
              id='preset'
              onChange={(e) => handleParameterPreset(e)}
            >
              <option value='custom'>custom</option>
              <option value='very specific'>very specific</option>
              <option value='more specific'>more specific</option>
              <option value='default'>default</option>
              <option value='more sensitive'>more sensitive</option>
              <option value='very sensitive'>very sensitive</option>
            </select>
  
            <label
              className='grid-checkbox'
              htmlFor='check'
              data-title='If this option is enabled, the normalized RNA-seq graphs are written. Note that writing the graphs will increase the runtime.'
            >
              <input
                type='checkbox'
                name='rna-seq-graph'
                id='check'
                checked={rnaGraph}
                onChange={() => setRnaGraph(!rnaGraph)} />
              write rna-seq graph
            </label>
          </div>
  
          {!parameters.parameterBox ? (
            <p></p>
          ) : (
            <ParameterAllGroups
              parameterGroups={parameters.parameterBox}
              grid={true}
              onChange={(e) => handleParameters(e)} />
          )}
        </div>
      </div>
  
      <div className='footer'>
        <button
          className='button no-margin'
          type='button'
          onClick={() => {
            setConfHeader("Upload Config File");
            setText("Select the config file (.config).");
            setConfPopup(true);
          } }
        >
          Load
        </button>
        <p>or</p>
        <button className='button no-margin' type='button' onClick={() => saveConfigFile()}>
          Save
        </button>
        <p>Configuration</p>
        {loading[0] ? (
          <div className='loading'>
            <ClipLoader color='#ffa000' loading={loading[0]} size={30} />
          </div>
        ) : (
          <button className='button run' type='button' onClick={(e) => handleSubmit(e)}>
            Start TSS prediction
          </button>
        )}
      </div>
    </div>;
  }

  export default FormConfig;