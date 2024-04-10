import React, { useState } from "react";
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
  fillGenomes,
  checkInput,
  loading,
  handleSubmit
}) {
  // open/close parameters
  const [showParam, setShowParam] = useState(false);
  /**
  * save input to config file and download given config file
  */
  const saveConfigFile = () => {
    // if studytype condition: fill out alignment and output id
    fillGenomes();

    if (checkInput()) {
      // save filenames from genomes
      const tmpGenome = [...genomes];

      for (let i = 0; i < genomes.length; i++) {
        var tmpFasta = "";
        var tmpAnn = "";

        // genomeFasta file
        try {
          tmpFasta = genomes[i]["genome" + (i + 1)]["genomefasta"].name;
        } catch {
          console.log("Wrong fasta file");
        }
        tmpGenome[i]["genome" + (i + 1)]["genomefasta"] = tmpFasta;

        // genomeAnnotation file
        try {
          // multiFasta -> gff file in folder, else single file
          if (multiFasta[i]) {
            tmpAnn = genomes[i]["genome" + (i + 1)]["genomeannotation"][0].webkitRelativePath;
            var name = tmpAnn.split("/");
            tmpAnn = name[name.length - 2] + "/";
          } else {
            tmpAnn = genomes[i]["genome" + (i + 1)]["genomeannotation"][0].name;
          }
        } catch {
          console.log("Wrong annotation file");
        }
        tmpGenome[i]["genome" + (i + 1)]["genomeannotation"] = tmpAnn;
      }

      // save file names from replicates
      const tmpRep = [...replicates];

      for (let i = 0; i < tmpRep.length; i++) {
        var tmpG = tmpRep[i]["genome" + (i + 1)];

        for (let k = 0; k < tmpG.length; k++) {
          const letter = String.fromCharCode(97 + k);

          var tmpEF = "";
          var tmpER = "";
          var tmpNF = "";
          var tmpNR = "";

          try {
            tmpEF = tmpG[k]["replicate" + letter]["enrichedforward"].name;
          } catch {
            console.log("Wrong enriched forward file");
          }
          tmpG[k]["replicate" + letter]["enrichedforward"] = tmpEF;

          try {
            tmpER = tmpG[k]["replicate" + letter]["enrichedreverse"].name;
          } catch {
            console.log("Wrong enriched reverse file");
          }
          tmpG[k]["replicate" + letter]["enrichedreverse"] = tmpER;

          try {
            tmpNF = tmpG[k]["replicate" + letter]["normalforward"].name;
          } catch {
            console.log("Wrong normal forward file");
          }
          tmpG[k]["replicate" + letter]["normalforward"] = tmpNF;

          try {
            tmpNR = tmpG[k]["replicate" + letter]["normalreverse"].name;
          } catch {
            console.log("Wrong normal reverse file");
          }
          tmpG[k]["replicate" + letter]["normalreverse"] = tmpNR;
        }
        tmpRep[i]["genome" + (i + 1)] = tmpG;
      }

      // alignmentFile
      var tmpAlignFile = " ";
      try {
        tmpAlignFile = alignmentFile.name;
      } catch {
        console.log("no alignment file");
      }

      // multiFasta files?
      let multiFastaString = String(multiFasta);

      // send input parameters to server
      const formData = new FormData();
      formData.append("projectname", JSON.stringify(projectName));
      formData.append("parameters", JSON.stringify(parameters));
      formData.append("rnagraph", JSON.stringify(rnaGraph));
      formData.append("replicateNum", JSON.stringify({ num: numRep }));
      formData.append("genomes", JSON.stringify(tmpGenome));
      formData.append("replicates", JSON.stringify(tmpRep));
      formData.append("alignmentFile", JSON.stringify(tmpAlignFile));
      formData.append("multiFasta", JSON.stringify(multiFastaString));
      fetch("/api/saveConfig/", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.blob())
        .then((blob) => {
          var name = projectName.replace(" ", "_") + ".config";

          // Create blob link to download
          const url = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", name);

          // Append to html link element page
          document.body.appendChild(link);

          // Start download
          link.click();

          // Clean up and remove the link
          link.parentNode.removeChild(link);
        })
        .catch((err) => console.log(err));
    }
  };
  return <div className='form-container'>
    <div>
      <div class="form-group">
        <label for="project-name" class="project-name-label">
          <h3 className='header'>Project Name:</h3></label>
        <input
          id="project-name"
          class="project-name"
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