import React, { useState } from "react";
import ParameterGroup from "./ParameterGroup";
import ParameterAllGroups from "./ParameterAllGroups";
import Tabs from "./Tabs";
import ClipLoader from "react-spinners/ClipLoader";
import "../../css/Tabs.css";
import "../../css/App.css";
import "../../css/Grid.css";
import "../../css/DragDrop.css";
import SingleSelectDropdown from "../Result/SingleSelect";


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
  fillGenomes,
  checkInput,
  loading,
  handleSubmit,
  showError
}) {
  // open/close parameters
  const [showParam, setShowParam] = useState(false);
  /**
  * save input to config file and download given config file
  */
  const saveConfigFile = () => {
    fillGenomes();

    if (!checkInput()) return;

    const getFileName = (obj, key) => {
      try {
        return obj[key].name;
      } catch {
        console.log(`Wrong ${key} file`);
        return "";
      }
    };

    const tmpGenome = genomes.map((genome, i) => {
      const genomeKey = `genome${i + 1}`;
      console.log(genome[genomeKey])
      const genomeObj = { ...genome[genomeKey] };

      genomeObj.genomefasta = getFileName(genomeObj, "genomefasta");
      console.log(genomeObj)
      console.log(multiFasta[i])
      if (multiFasta[i]) {
        console.log(genomeObj.genomeannotation[0])
        const path = genomeObj.genomeannotation[0].webkitRelativePath;
        genomeObj.genomeannotation = path.split("/").slice(0, -1).join("/");
      } else {
        genomeObj.genomeannotation = genomeObj.genomeannotation[0].name;
      }

      return { [genomeKey]: genomeObj };
    });

    const tmpRep = replicates.map((replicate, i) => {
      const genomeKey = `genome${i + 1}`;
      const genomeObj = replicate[genomeKey].map((rep, k) => {
        const replicateKey = `replicate${String.fromCharCode(97 + k)}`;
        const repObj = { ...rep[replicateKey] };

        ["enrichedforward", "enrichedreverse", "normalforward", "normalreverse"].forEach((key) => {
          repObj[key] = getFileName(repObj, key);
        });

        return { [replicateKey]: repObj };
      });

      return { [genomeKey]: genomeObj };
    });

    const tmpAlignFile = alignmentFile.name || " ";

    const formData = new FormData();
    formData.append("projectname", JSON.stringify(projectName));
    formData.append("parameters", JSON.stringify(parameters));
    formData.append("rnagraph", JSON.stringify(rnaGraph));
    formData.append("replicateNum", JSON.stringify({ num: numRep }));
    formData.append("genomes", JSON.stringify(tmpGenome));
    formData.append("replicates", JSON.stringify(tmpRep));
    formData.append("alignmentFile", JSON.stringify(tmpAlignFile));
    formData.append("multiFasta", JSON.stringify(String(multiFasta)));

    fetch("/api/saveConfig/", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.blob()
      })
      .then((blob) => {
        console.log(blob)
        const name = `${projectName.replace(" ", "_")}.config`;
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", name);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch((err) => showError(`Error during saving config file: ${err}`));
  };
  return <div className='form-container'>
    <div>
      <div className="form-group">
        <label htmlFor="project-name" className="project-name-label">
          <h3 className='header'>Project Name:</h3></label>
        <input
          id="project-name"
          className="project-name"
          type="text"
          name="project-name"
          placeholder="Your Project Name"
          value={projectName} onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

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
        {!parameters.setup ? (
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
                <div  style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "50vw",
              }}>
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
          <div 
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "50vw",
            }}
          >

          <SingleSelectDropdown
                  helpText={`Predefined set of parameters for the TSS prediction. The parameters can be adjusted in the parameter section.`}

            label='Prediction parameters Preset'
            value={parameterPreset}
            onChange={(value) => {
              let tmp = { target: { name: 'parameter-preset', value: value, id: 'preset' } }
              handleParameterPreset(tmp)
            }}
            options={[
              { value: 'custom', label: 'custom' },
              { value: 'very specific', label: 'very specific' },
              { value: 'more specific', label: 'more specific' },
              { value: 'default', label: 'default' },
              { value: 'more sensitive', label: 'more sensitive' },
              { value: 'very sensitive', label: 'very sensitive' },
            ]}
            headerStyle={{ fontSize: '1.05em' }}
            />

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
          setText("Select the config file (.config) or a JSON file (.json).");
          setConfPopup(true);
        }}
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