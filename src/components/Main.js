import React, { useState, useEffect } from "react";
import "../css/Tabs.css";
import "../css/App.css";
import "../css/Grid.css";
import "../css/DragDrop.css";
import Error from "./Main/Error";
import LoadConfig from "./Main/LoadConfig";
import FormConfig from "./Main/ParameterInputField";
import Header from "./Main/Header";

/**
 * creates the main window and saves all inputs
 */
/**
 * Represents the Main component.
 */
function Main() {
  const [projectName, setProjectName] = useState("");
  const [parameters, setParameters] = useState([{}]);
  const [parameterPreset, setParameterPreset] = useState("default");
  // checkbox
  const [rnaGraph, setRnaGraph] = useState(false);

  const [genomes, setGenomes] = useState([
    {
      genome1: {
        name: "Condition_1",
        placeholder: "Condition_1",
        alignmentid: "",
        outputid: "",
        genomefasta: "",
        genomeannotation: [],
      },
    },
  ]);
  const initConfigReplicates = {
    replicatea: {
      name: "Replicate a",
      enrichedforward: "",
      enrichedreverse: "",
      normalforward: "",
      normalreverse: "",
    },
  }
  const [replicates, setReplicates] = useState([
    {
      genome1: [
        initConfigReplicates
      ],
    },
  ]);
  const [alignmentFile, setAlignmentFile] = useState("");
  // saves the value of the checkbox: if genome file is multiFasta or not
  const [multiFasta, setMultiFasta] = useState([false]);
  
  // new GenomeTab: use replicateTemplate to update replicates
  const [replicateTemplate, setReplicateTemplate] = useState([
    initConfigReplicates    
  ]);
  // template für a single replicate
  const repTemplate =
    '{"replicate0":{"name":"Replicate 0", "enrichedforward":"", "enrichedreverse":"", "normalforward":"", "normalreverse":""}}';
  // number of replicates
  const [numRep, setnumRep] = useState(1);

  // show error popup
  const [ePopup, setEPopup] = useState(false);
  const [error, setError] = useState("");
  const [eHeader, seteHeader] = useState("ERROR");

  // show config popup
  const [confPopup, setConfPopup] = useState(false);
  const [text, setText] = useState("");
  const [confHeader, setConfHeader] = useState("Upload Config File");
  const [confFile, setConfFile] = useState("");

  // show name of genom tab: set to true when genome names of alignment file are used
  const [showGName, setShowGName] = useState(false);

  // loading spinner [runButton, loadExampleData]
  const [loading, setLoading] = useState([false, false]);

  /**
   * GETs Parameters from flask
   */
  useEffect(() => {
    fetch("/api/parameters/")
      .then((res) => res.json())
      .then((parameters) => setParameters(parameters));
  }, []);

  /**
   * RUN Button event
   */
  const handleSubmit = (event, check = true) => {

    event.preventDefault();
    setLoading([!loading[0], loading[1]]);
    // if studytype condition: fill out alignment, output id and multiFasta
    fillGenomes();

    var run = checkInput();

    // run without annotation files
    if (!check) {
      run = true;
      // close popup from warning that no annotation files are given
      setEPopup(!ePopup);
    }
    if (run) {
      sendDataAsync();
    }
  };

  /**
   * if studytype: condition -> fill out alignment id, output id, fasta, annotation in genomes nad multiFasta
   */
  const fillGenomes = () => {
    if (parameters.setup.typeofstudy.value === "condition") {
      const temp = [...genomes];
      const fasta = temp[0]["genome1"]["genomefasta"];
      const annotation = temp[0]["genome1"]["genomeannotation"];
      var outputId = temp[0]["genome1"]["outputid"];

      // for all genomes same value, because all use same genome fasta file
      let tmpMultiFasta = Array(multiFasta.length).fill(multiFasta[0]);
      setMultiFasta([...tmpMultiFasta]);

      for (let i = 0; i < genomes.length; i++) {
        temp[i]["genome" + (i + 1)]["alignmentid"] = i + 1;
        temp[i]["genome" + (i + 1)]["outputid"] = outputId;
        temp[i]["genome" + (i + 1)]["genomefasta"] = fasta;
        temp[i]["genome" + (i + 1)]["genomeannotation"] = annotation;
      }
      setGenomes([...temp]);
    }
  };

  const checkInput = () => {
    const showErrorWithHeader = (error, header = "ERROR") => {
        seteHeader(header);
        showError(error);
        return false;
    };

    const isInvalidFileFormat = (file, validFormats) =>
        !validFormats.includes(file.name.split(".").pop());

    // Project Name Check
    if (!projectName) return showErrorWithHeader("Project Name is missing.");

    let studyType = parameters.setup.typeofstudy.value === "genome" ? "Genome" : "Condition";

    // Genome Specific Checks
    if (studyType === "Genome" && genomes.length < 2) 
        return showErrorWithHeader("For the Comparison of different strains/species at least 2 Genomes are needed.");

    if (alignmentFile && isInvalidFileFormat(alignmentFile, ["xmfa"])) 
        return showErrorWithHeader("Alignment file has the wrong format. XMFA file format (.xmfa) is needed.");

    // Validate Genomes, Alignment IDs, and Fasta Files
    const names = new Set();
    const alignmentIds = new Set();
    const fastaFormats = ["fasta", "fna", "ffn", "faa", "frn", "fa"];

    for (let i = 0; i < genomes.length; i++) {
        const genomeNumber = i + 1;
        const genome = genomes[i][`genome${genomeNumber}`];
        if (!Boolean(genome.name)) 
            return showErrorWithHeader(`Missing name for ${studyType} ${genomeNumber}. Click in the tab header and choose a unique name.`);
        
        if (!genome.alignmentid) 
            return showErrorWithHeader(`Missing Alignment ID for ${studyType} ${genomeNumber}.`);

        if (!genome.outputid) 
            return showErrorWithHeader(`Missing OutputID for ${studyType} ${genomeNumber}.`);

        if (!genome.genomefasta || isInvalidFileFormat(genome.genomefasta, fastaFormats)) 
            return showErrorWithHeader(`Missing or incorrect 'Genome FASTA' file format for ${studyType} ${genomeNumber}.`);

        names.add(genome.name);
        alignmentIds.add(parseInt(genome.alignmentid));
    }

    // Unique Genome Names and Alignment IDs Check
    if (names.size !== genomes.length) 
        return showErrorWithHeader(`${studyType} names are not unique.`);
    
    if (alignmentIds.size !== genomes.length) 
        return showErrorWithHeader("Alignment IDs are not unique.");

    // Validate Annotation Files
    for (let i = 0; i < genomes.length; i++) {
        const annotations = genomes[i][`genome${i + 1}`].genomeannotation;

        if (!annotations.length) 
            return showErrorWithHeader(`Missing 'Genome Annotation' file for ${studyType} ${i + 1}. This file is not required, but if no annotation file is given, all TSS will be classified as orphan.`, "WARNING");
        
        if (annotations.some(annotation => isInvalidFileFormat(annotation, ["gff", "gtf", "gff3"]))) 
            return showErrorWithHeader(`Incorrect 'Genome Annotation' file format for ${studyType} ${i + 1}. Annotation file format (.gff, .gtf, .gff3) is needed.`);
    }

    // Check Replicate Files
    // Assuming checkReplicateFiles is an existing function that returns a boolean
    for (let i = 0; i < replicates.length; i++) {
        const genomeReplicates = replicates[i][`genome${i + 1}`];
        for (let j = 0; j < genomeReplicates.length; j++) {
            const letter = String.fromCharCode(97 + j);
            const replicate = genomeReplicates[j][`replicate${letter}`];
            if (!["enrichedforward", "enrichedreverse", "normalforward", "normalreverse"]
                .every(key => checkReplicateFiles(replicate[key], `Replicate ${letter.toUpperCase()}`, studyType, i, j))) {
                return false;
            }
        }
    }

    return true;
};

  /**
   * check if replicate files are given and in the correct format
   */
  const checkReplicateFiles = (file, errorName, studyType, idxGenome, idxRep) => {
    const repFormats = ["gr", "wig"];
    if (file.length <= 0) {
      showError(
        "Missing '" +
          errorName +
          "' graph file for Replicate " +
          String.fromCharCode(97 + idxRep) +
          " in " +
          studyType +
          " " +
          (idxGenome + 1) +
          "."
      );
      return false;
    } else {
      const split = file.name.split(".");
      if (!repFormats.includes(split[split.length - 1])) {
        showError(
          errorName +
            " graph file for Replicate  " +
            String.fromCharCode(97 + idxRep) +
            " in " +
            studyType +
            " " +
            (idxGenome + 1) +
            " has the wrong format. Wiggle file format (.gr, .wig) is needed."
        );
        return false;
      }
    }
    return true;
  };


  /**
   * Sends data to the server using a POST request.
   * @function sendDataAsync
   * @returns {void}
   */
  function sendDataAsync() {
    const formData = new FormData();

    genomes.map((genome, i) => {
      const { genomefasta, genomeannotation } = genome[`genome${i + 1}`];
  
      formData.append("genomefasta", genomefasta);
  
      genomeannotation.map((annotation, k) => {
        formData.append(`genomeannotation${i + 1}`, annotation);
      });
  
      const rep = replicates[i][`genome${i + 1}`];
  
      rep.map((replicate, j) => {
        const letter = String.fromCharCode(97 + j);
        const { enrichedforward, enrichedreverse, normalforward, normalreverse } = replicate[`replicate${letter}`];
  
        formData.append("enrichedforward", enrichedforward);
        formData.append("enrichedreverse", enrichedreverse);
        formData.append("normalforward", normalforward);
        formData.append("normalreverse", normalreverse);
      });
    });

    formData.append("projectname", JSON.stringify(projectName));
    formData.append("parameters", JSON.stringify(parameters));
    formData.append("rnagraph", JSON.stringify(rnaGraph));
    formData.append("genomes", JSON.stringify(genomes));
    formData.append("replicates", JSON.stringify(replicates));
    formData.append("replicateNum", JSON.stringify({ num: numRep }));

    formData.append("alignmentfile", alignmentFile);

    fetch("/api/runAsync/", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        setLoading([false, false]);

        if (data.result === "success") {
          // open result in new tab
          let filePath = data.id;
          console.log(filePath);
          window.open(`/status/${filePath}`, "_blank", "noopener,noreferrer");
        } else {
          console.log(data);
        }
      })
      .catch((err) => console.log(err));
  }

  /**
   * save uploaded alignment file
   */
  const saveAlignmentFile = (e) => {
    setAlignmentFile(e.target.files[0]);
    // ask if file was created by mauve and than fill in genome names and ids
    seteHeader("INFO");
    showError(
      "If the alignment has been generated with Mauve, genome names and IDs can be read from the file. Do you want to do this?"
    );
  };

  /**
   * send alignment file to flask to read it
   * get back json object of genome names and alignment ids
   */
  const sendAlignmentFile = () => {
    // close popup
    setEPopup(!ePopup);

    // send file to server
    const formData = new FormData();
    formData.append("alignmentFile", alignmentFile);
    fetch("/api/alignment/", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.result === "success") {
          // fill out genome names and ids
          const dataResult = data.data;
          // change number of genomes
          const numGenomes = Object.keys(dataResult).length / 2;
          setShowGName(true);
          updateGenomes(numGenomes, dataResult);
        } else {
          showError(data.data);
        }
      })
      .catch((err) => console.log(err));
  };

  /**
   * update useState of changed paramter p
   * if other parameters are dependend on p they are also updated
   */
  const handleParameters = (event) => {
    const name = event.target.name;
    const directParent = event.target.id;
    let val;

    // combobox
    if (name === "typeofstudy" || name === "clustermethod") {
      val = event.target.value;
      // input=number -> save value as number
    } else {
      val = event.target.valueAsNumber;
      if (isNaN(val)) {
        return;
      }
    }

    if (directParent === "setup") {
      updateSetupBox(name, "value", val);
    } else {
      updateParameterBox(directParent, name, "value", val);
      checkPreset(val, name);
    }
    if (name === "numberofreplicates") {
      updateReplicates(val);
    }
    if (name === "numberofgenomes") {
      updateGenomes(val);
    }
    if (name === "stepfactor") {
      updateParameterBox(directParent, "stepfactorreduction", "max", val);
      if (parameters.parameterBox["Prediction"]["stepfactorreduction"]["value"] > val) {
        parameters.parameterBox["Prediction"]["stepfactorreduction"]["value"] = val;
      }
    }
    if (name === "stepheight") {
      updateParameterBox(directParent, "stepheightreduction", "max", val);
      if (parameters.parameterBox["Prediction"]["stepheightreduction"]["value"] > val) {
        parameters.parameterBox["Prediction"]["stepheightreduction"]["value"] = val;
      }
    }
    // update Genome/Condition label
    if (name === "typeofstudy") {
      if (val === "condition") {
        setShowGName(false);
      }

      const newName = "Number of " + val.charAt(0).toUpperCase() + val.slice(1) + "s";
      // Number of Genomes/Conditions
      updateSetupBox("numberofgenomes", "name", newName);

      // Genome/Condition Tabs
      genomes.forEach((g, i) => {
        g["genome" + (i + 1)].placeholder =
          val.charAt(0).toUpperCase() + val.slice(1) + "_" + (i + 1);
        g["genome" + (i + 1)].name = val.charAt(0).toUpperCase() + val.slice(1) + "_" + (i + 1);
      });
      setGenomes([...genomes]);

      // allowed cross-genome/condition shift
      updateParameterBox(
        "Comparative",
        "allowedcrossgenomeshift",
        "name",
        "allowed cross-" + val + " shift"
      );
    }
  };

  /**
   * update number of replicate tabs
   */
  const updateReplicates = (val) => {
    setnumRep(val);
    // update maximum of Parameter 'matching replicates'
    updateParameterBox("Comparative", "matchingreplicates", "max", val);

    const numRep = replicateTemplate.length;

    // replicate added
    if (val > numRep) {
      // add all needed replicates
      for (let i = numRep + 1; i <= val; i++) {
        const repLetter = String.fromCharCode(96 + i);
        const newRep = JSON.parse(repTemplate.replaceAll("0", repLetter));

        // update replicate template
        replicateTemplate.push(newRep);
        setReplicateTemplate(replicateTemplate);
        // update replicates
        for (let j = 0; j < replicates.length; j++) {
          replicates[j]["genome" + (j + 1)].push(newRep);
        }
        setReplicates(replicates);
      }

      // replicate removed
    } else if (val < numRep && val > 0) {
      const difference = numRep - val;
      for (let i = 0; i < difference; i++) {
        // update replicate template
        replicateTemplate.pop();
        setReplicateTemplate(replicateTemplate);
        // update replicates
        for (var j = 0; j < replicates.length; j++) {
          replicates[j]["genome" + (j + 1)].pop();
        }
        setReplicates(replicates);
      }
    }
  };

  /**
   * update number of genome tabs
   * @param val: the new number of genomes
   * @param data: object with genome names and ids from the alignment file
   */
  const updateGenomes = (val, data) => {
    parameters.setup.numberofgenomes.value = val;

    var tmpGenome = [...genomes];
    var tmpReplicate = [...replicates];

    // add genom tab
    const numGenomes = Object.keys(genomes).length;
    if (val > numGenomes) {
      // add all needed genomes
      for (let i = numGenomes + 1; i <= val; i++) {
        const { value: studyType } = parameters.setup.typeofstudy;
        const studyTypeCapitalized = `${studyType.charAt(0).toUpperCase()}${studyType.slice(1)}`;
        const genomeName = `${studyTypeCapitalized}_${i}`;
        const placeholder = `${studyTypeCapitalized}_${i}`;

        var alignmentID = "";
        if (data) {
          genomeName = data["genome_" + i];
          alignmentID = data["id_" + i];
        }
        tmpGenome.push({
          ["genome" + i]: {
            name: genomeName,
            placeholder: placeholder,
            alignmentid: alignmentID,
            outputid: "",
            genomefasta: "",
            genomeannotation: [],
          },
        });
        multiFasta.push(false);
        // add new genome to replicates
        tmpReplicate.push({ ["genome" + i]: [...replicateTemplate] });
      }
      // update genome names and alignmetn ids
      if (typeof data !== "undefined") {
        for (let i = 0; i < numGenomes; i++) {
          tmpGenome[i]["genome" + (i + 1)]["name"] = data["genome_" + (i + 1)];
          tmpGenome[i]["genome" + (i + 1)]["alignmentid"] = data["id_" + (i + 1)];
        }
      }

      // remove genome tab
    } else if (val < numGenomes && val > 0) {
      // remove all genomes
      const difference = numGenomes - val;
      for (let i = 0; i < difference; i++) {
        // remove last genome
        tmpGenome.pop();
        multiFasta.pop();
        // remove genome from replicates
        tmpReplicate.pop();
      }
      // update genome names and alignment ids
      if (data) {
        for (let i = 0; i < numGenomes; i++) {
          const genomeKey = `genome${i + 1}`;
          const dataKey = `genome_${i + 1}`;
          if (tmpGenome[i][genomeKey]) {
            tmpGenome[i][genomeKey].name = data[dataKey];
            tmpGenome[i][genomeKey].alignmentid = data[dataKey];
          }
        }
      }
      // data from alignment file
    } else if (val === numGenomes) {
      // update genome names and alignment ids
      if (data) {
        for (let i = 0; i < numGenomes; i++) {
          const genomeKey = `genome${i + 1}`;
          const dataKey = `genome_${i + 1}`;
          if (tmpGenome[i][genomeKey]) {
            tmpGenome[i][genomeKey].name = data[dataKey];
            tmpGenome[i][genomeKey].alignmentid = data[dataKey];
          }
        }
      }
    }
    setGenomes([...tmpGenome]);
    setMultiFasta([...multiFasta]);
    setReplicates([...tmpReplicate]);
  };
  /**
   * update parameter value in setup box (type of study, number of conditions, number of replicates)
   */
  const updateSetupBox = (node, element, value) => {
    setParameters((current) => ({
      ...current,
      setup: {
        ...current.setup,
        [node]: { ...current.setup[node], [element]: value },
      },
    }));
  };
  /**
   * update parameter value in parameter box
   */
  const updateParameterBox = (parent, node, element, value) => {
    setParameters((current) => ({
      ...current,
      parameterBox: {
        ...current.parameterBox,
        [parent]: {
          ...current.parameterBox[parent],
          [node]: { ...current.parameterBox[parent][node], [element]: value },
        },
      },
    }));
  };

  /**
   * checks if parameter preset for current parameter values exists
   */
  const checkPreset = (value, parameterName) => {
    const names = [
      "stepheight",
      "stepheightreduction",
      "stepfactor",
      "stepfactorreduction",
      "enrichmentfactor",
      "processingsitefactor",
    ];
    const values = [
      "default",
      "more sensitive",
      "more specific",
      "very sensitive",
      "very specific",
    ];
    const match = [];

    if (!names.includes(parameterName)) {
      return;
    }

    values.forEach((val) => {
      const v = val.replace(" ", "");
      // matches changed parameter value with parameter preset
      if (parameters.parameterBox.Prediction[parameterName][v] === value) {
        match.push(val);
      }
    });

    // check remaining parameters
    if (match.length === 0) {
      setParameterPreset("custom");
    } else {
      names.forEach((name) => {
        if (name !== parameterName) {
          match.forEach((mat) => {
            const v = mat.replace(" ", "");
            if (
              parameters.parameterBox.Prediction[name][v] !==
              parameters.parameterBox.Prediction[name].value
            ) {
              match.pop(mat);
            }
          });
        }
      });
    }
    if (match.length !== 0) {
      setParameterPreset(match[0]);
    }
  };

  /**
   * updates parameters according to the chosen parameter preset
   */
  const handleParameterPreset = (event) => {
    setParameterPreset(event.target.value);
    const preset = event.target.value.replace(" ", "");

    if (typeof parameters.parameterBox !== "undefined" && event.target.value !== "custom") {
      const names = [
        "stepheight",
        "stepheightreduction",
        "stepfactor",
        "stepfactorreduction",
        "enrichmentfactor",
        "processingsitefactor",
      ];
      names.forEach((name) => {
        updateParameterBox(
          "Prediction",
          name,
          "value",
          parameters.parameterBox.Prediction[name][preset]
        );
      });
    }
  };

  /**
   * updates text input/checkbox in genome tabs
   */
  const handleTabs = (event) => {
    const name = event.target.name;
    const id = parseInt(event.target.id);
    if (name === "name") {
      setShowGName(true);
    }
    if (name === "multiFasta") {
      multiFasta[id] = !multiFasta[id];
      setMultiFasta([...multiFasta]);
    } else {
      const value = event.target.value;
      let temp = [...genomes];
      temp[id]["genome" + (id + 1)][name] = value;
      setGenomes([...temp]);
    }
  };

  /**
   * saves an individual file from genome & replicate tabs
   */
  const saveIndividualFile = (event) => {
    const node = event.target.name;
    const id = event.target.id;
    const file = event.target.files[0];

    const maxFileSize = 200000000;
    if (file.size > maxFileSize) {
      seteHeader("ERROR");
      showError("The file " + file.name + " exceeds the maximum size of 200MB.");
    } else {
      // replicate
      if (id.length > 5) {
        saveReplicates(parseInt(id[0]), parseInt(id[2]), node, file);
        // genome
      } else {
        saveGenomes(parseInt(id[0]), node, file);
      }
    }
  };

  /**
   * saves uploaded annotation folder/file from upload files individually
   */
  const saveAnnotationFile = (event) => {
    const node = event.target.name;
    const id = parseInt(event.target.id[0]);
    const temp = [...genomes];
    const tmpArray = [];

    const maxFileSize = 200000000;

    for (let i = 0; i < event.target.files.length; i++) {
      if (event.target.files[i].size > maxFileSize) {
        seteHeader("ERROR");
        showError("The file " + event.target.files[i].name + " exceeds the maximum size of 200MB.");
      } else {
        // ignore hidden files
        if (event.target.files[i].name[0] !== ".") {
          tmpArray.push(event.target.files[i]);
          temp[id]["genome" + (id + 1)][node] = tmpArray;
          setGenomes([...temp]);
        }
      }
    }
  };
  /**
   * Saves files that are uploaded over the 'upload all files together' button.
   * @param {Object} genomeFiles - Object containing genome files.
   * @param {Object} enrichFor - Object containing enriched forward files.
   * @param {Object} enrichRev - Object containing enriched reverse files.
   * @param {Object} normalFor - Object containing normal forward files.
   * @param {Object} normalRev - Object containing normal reverse files.
   * @param {number} genomeIdx - Index of the genome.
   */
  const saveFiles = (genomeFiles, enrichFor, enrichRev, normalFor, normalRev, genomeIdx) => {
    if (genomeFiles.genomefasta.name) {
      saveGenomes(genomeIdx, "genomefasta", genomeFiles.genomefasta);
    }
    if (genomeFiles.genomeannotation.length > 0) {
      saveGenomes(genomeIdx, "genomeannotation", genomeFiles.genomeannotation);
    }

    Object.keys(enrichFor).forEach((key) => {
      if (enrichFor[key].name) {
        saveReplicates(genomeIdx, parseInt(key), "enrichedforward", enrichFor[key]);
      }
    });
    Object.keys(enrichRev).forEach((key) => {
      if (enrichRev[key].name) {
        saveReplicates(genomeIdx, parseInt(key), "enrichedreverse", enrichRev[key]);
      }
    });
    Object.keys(normalFor).forEach((key) => {
      if (normalFor[key].name) {
        saveReplicates(genomeIdx, parseInt(key), "normalforward", normalFor[key]);
      }
    });
    Object.keys(normalRev).forEach((key) => {
      if (normalRev[key].name) {
        saveReplicates(genomeIdx, parseInt(key), "normalreverse", normalRev[key]);
      }
    });
  };

  /**
   * saves genome files
   */
  const saveGenomes = (gId, node, file) => {
    const maxFileSize = 200000000;
    var tmpArray = [];

    const temp = [...genomes];

    // annotation files
    if (Array.isArray(file)) {
      file.forEach((f) => {
        // check file size
        if (f.size > maxFileSize) {
          seteHeader("ERROR");
          showError("The file " + f.name + " exceeds the maximum size of 200MB.");
        } else {
          tmpArray.push(f);
        }
      });
      temp[gId]["genome" + (gId + 1)][node] = tmpArray;
    } else {
      if (file.size > maxFileSize) {
        seteHeader("ERROR");
        showError("The file " + file.name + " exceeds the maximum size of 200MB.");
      } else {
        temp[gId]["genome" + (gId + 1)][node] = file;
      }
    }

    setGenomes([...temp]);
  };

  /**
   * saves replicate files
   * gId: genome index
   * rId: replicate index
   */
  const saveReplicates = (gId, rId, node, file) => {
    const maxFileSize = 200000000;
    // check file size
    if (file.size > maxFileSize) {
      seteHeader("ERROR");
      showError("The file " + file.name + " exceeds the maximum size of 200MB.");
    } else {
      const replicate = "replicate" + String.fromCharCode(97 + rId);

      let newValue = { ...replicates[gId]["genome" + (gId + 1)][rId][replicate] };
      newValue[node] = file;
      let temp = [...replicates];
      temp[gId]["genome" + (gId + 1)][rId] = { [replicate]: newValue };
      setReplicates([...temp]);
    }
  };

  /**
   * popup window with error
   */
  const showError = (error) => {
    setError(error);
    setEPopup(!ePopup);
    setLoading([false, false]);
  };

  /**
   * save uploaded config file
   */
  const uploadConfig = (event) => {
    const file = event.target.files[0];
    const split = file.name.split(".");
    if (split[split.length - 1] !== "config") {
      setConfPopup(false);
      showError("Config File has wrong format. Config file format (.config) needed.");
    } else {
      setConfHeader("Upload Folder");
      setText("Select the folder that contains all needed files."); //The genome annotation files for each Genome/Condition have to be in separate directories.")
      setConfFile(file);
    }
  };

  /**
   * save uploaded files that are needed for the config file
   */
  const uploadConfFiles = (event) => {
    const maxFileSize = 200000000;
    var filesOK = true;

    const files = event.target.files;
    const tmpArray = [];
    for (let i = 0; i < files.length; i++) {
      // check file size
      if (files[i].size > maxFileSize) {
        seteHeader("ERROR");
        showError("The file " + files[i].name + " exceeds the maximum size of 200MB.");
        filesOK = false;
        return;
      } else {
        tmpArray.push(files[i]);
      }
    }
    setConfPopup(false);

    if (filesOK) {
      sendConfig(tmpArray);
    }
  };

  /**
   * send all uploaded files for the config to the flask server
   * get back the assignment between files and genomes/replicates, parameters
   */
  const sendConfig = (tmpArray) => {
    const allFiles = tmpArray;

    // send config file to server
    const formData = new FormData();
    formData.append("configFile", confFile);
    formData.append("parameters", JSON.stringify(parameters));
    formData.append("genomes", JSON.stringify(genomes));
    formData.append("replicates", JSON.stringify(replicates));
    fetch("/api/loadConfig/", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.result === "success") {
          var result = data.data;

          setProjectName(result["projectName"]);
          setParameters(JSON.parse(result["parameters"]));
          setRnaGraph(result["rnaGraph"] === "true");

          assignFiles(
            allFiles,
            result["multiFasta"],
            [...JSON.parse(result["genomes"])],
            [...JSON.parse(result["replicates"])],
            result["numReplicate"],
            result["alignmentFile"]
          );
        } else {
          showError(data.data);
        }
      })
      .catch((err) => console.log(err));
  };

  /**
   * assign given files to genomes/replicates
   */
  const assignFiles = (
    allFiles,
    new_multiFasta,
    new_genomes,
    new_replicates,
    new_replicateNum,
    new_alignmentFile
  ) => {
    // multiFasta String array to boolean array
    let tmpMultiF = new_multiFasta.map((s) => {
      if (s === "true") return true;
      return false;
    });
    setMultiFasta([...tmpMultiF]);

    // assign uploaded files to genomes
    for (let i = 0; i < new_genomes.length; i++) {
      var tmpFasta = new_genomes[i]["genome" + (i + 1)]["genomefasta"];
      var tmpAnnotation = new_genomes[i]["genome" + (i + 1)]["genomeannotation"];
      new_genomes[i]["genome" + (i + 1)]["genomeannotation"] = [];

      for (let j = 0; j < allFiles.length; j++) {
        if (allFiles[j].name === tmpFasta) {
          new_genomes[i]["genome" + (i + 1)]["genomefasta"] = allFiles[j];
          // annotation file
        } else {
          // multiFasta file -> annotation folder with all annotation files for this genome
          if (tmpMultiF[i]) {
            // get entire path inclusive the parent folder and gff folder that contains the file
            var str = allFiles[j].webkitRelativePath;
            // get the parent folder name of all files
            var name = str.split("/")[0];
            // remove the parent folder name from the string -> get: gff_folder_name/file_name.gff
            str = str.replace(name + "/", "");

            // check if gff_folder_name is the same as tmpAnnotation(= folder name from contig file)
            if (str.split("/")[0] + "/" === tmpAnnotation) {
              new_genomes[i]["genome" + (i + 1)]["genomeannotation"].push(allFiles[j]);
            }
            // single annotation file
          } else if (allFiles[j].name === tmpAnnotation) {
            new_genomes[i]["genome" + (i + 1)]["genomeannotation"] = [allFiles[j]];
          }
        }
      }
    }

    // assign uploaded files to replicates
    for (let i = 0; i < new_replicates.length; i++) {
      var tmpG = new_replicates[i]["genome" + (i + 1)];

      for (let k = 0; k < tmpG.length; k++) {
        const letter = String.fromCharCode(97 + k);

        var tmpEF = tmpG[k]["replicate" + letter]["enrichedforward"];
        var tmpER = tmpG[k]["replicate" + letter]["enrichedreverse"];
        var tmpNF = tmpG[k]["replicate" + letter]["normalforward"];
        var tmpNR = tmpG[k]["replicate" + letter]["normalreverse"];

        for (let j = 0; j < allFiles.length; j++) {
          let fileName = allFiles[j].name;

          if (fileName === tmpEF) {
            tmpG[k]["replicate" + letter]["enrichedforward"] = allFiles[j];
          } else if (fileName === tmpER) {
            tmpG[k]["replicate" + letter]["enrichedreverse"] = allFiles[j];
          } else if (fileName === tmpNF) {
            tmpG[k]["replicate" + letter]["normalforward"] = allFiles[j];
          } else if (fileName === tmpNR) {
            tmpG[k]["replicate" + letter]["normalreverse"] = allFiles[j];
          }
        }
      }
      new_replicates[i]["genome" + (i + 1)] = tmpG;
    }

    // update replicate template
    updateReplicateTemplate(parseInt(new_replicateNum));

    setReplicates([...new_replicates]);
    setGenomes([...new_genomes]);
    setShowGName(true);

    // if alignmentFile given assign it to useState
    if (new_alignmentFile.length > 0) {
      for (let j = 0; j < allFiles.length; j++) {
        if (allFiles[j].name === new_alignmentFile) {
          setAlignmentFile(allFiles[j]);
          break;
        }
      }
    }
  };

  /**
   * update replicate template
   */
  const updateReplicateTemplate = (newRepNum) => {
    if (newRepNum > numRep) {
      for (let i = numRep; i < newRepNum; i++) {
        const repLetter = String.fromCharCode(97 + i);
        const newRep = JSON.parse(repTemplate.replaceAll("0", repLetter));
        // update replicate template
        replicateTemplate.push(newRep);
        setReplicateTemplate(replicateTemplate);
      }
    } else if (newRepNum < numRep) {
      const diff = numRep - newRepNum;
      for (let i = 0; i < diff; i++) {
        replicateTemplate.pop();
        setReplicateTemplate(replicateTemplate);
      }
    }
    setnumRep(newRepNum);
  };

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

  /**
   * Loads example data based on the selected organism.
   * @param {Event} event - The event object triggered by the user action.
   * @returns {Promise<void>} - A promise that resolves when the example data is loaded.
   */
  const loadExampleData = async (event) => {
    const organism = event.target.name;
    setLoading([true, true]);
  
    try {
      const configResponse = await fetch(`/api/exampleData/${organism}/json/-/`);
      const configData = await configResponse.json();
      const jsonConfig = JSON.parse(configData.result);
  
      setParameters(jsonConfig["parameters"]);
      setProjectName(jsonConfig["projectName"]);
      setRnaGraph(jsonConfig["rnaGraph"] === "true");
  
      // Parallelize fetching of genome and replicate files
      const genomePromises = jsonConfig["genomes"].map((genome, i) => fetchGenomeFiles(organism, genome, i, jsonConfig));
      const genomes = await Promise.all(genomePromises);
      const replicatePromises = jsonConfig["replicates"].map((replicate, i) => fetchReplicateFiles(organism, replicate, i));
      const replicates = await Promise.all(replicatePromises);
  
      setGenomes(genomes);
      setShowGName(true);
      setReplicates(replicates);
      updateReplicateTemplate(parseInt(jsonConfig["numReplicates"]));
  
      // Convert multiFasta strings to boolean
      const multiFasta = jsonConfig["multiFasta"].map(s => s === "true");
      setMultiFasta(multiFasta);
  
      // Fetch alignment file if provided
      if (jsonConfig["alignmentFile"]) {
        await fetchAlignmentFile(organism, jsonConfig["alignmentFile"]);
      }
    } catch (error) {
      console.error('Error loading example data:', error);
    } finally {
      setLoading([false, false]);
    }
  };
  
  /**
   * Fetches genome files for a given organism and genome.
   * 
   * @param {string} organism - The name of the organism.
   * @param {object} genome - The genome object.
   * @param {number} index - The index of the genome.
   * @param {object} jsonConfig - The JSON configuration object.
   * @returns {Promise<object>} - A promise that resolves to the updated genome object.
   */
  async function fetchGenomeFiles(organism, genome, index, jsonConfig) {
    // Deep copy genome object
    let genomeNew = Object.assign({},genome);
    // Get type of study from config
    const typeOfStudy = jsonConfig["parameters"]["setup"]["typeofstudy"]["value"];

    let genomeID = typeOfStudy === "condition" ? "genome1" :  "genome" + (index+1) 
    
    console.log('Fetching genome files for', genome);
    console.log('Genome index:', index);
    let genomefileName = genome[genomeID]["genomefasta"];
    let annotationfileName = genome[genomeID]["genomeannotation"];

    // Fetching logic for genome files...
    const responseGenome = await fetch(`/api/exampleData/${organism}/files/${genomefileName}/`)
    const responseAnnotation = await fetch(`/api/exampleData/${organism}/files/${annotationfileName}/`)
    const blobGenome = await responseGenome.blob();
    const blobAnnotation = await responseAnnotation.blob();
    const genomeFiles = new File([blobGenome], genomefileName);
    const annotationFiles = new File([blobAnnotation], annotationfileName);
    genomeNew[genomeID]["genomefasta"] = genomeFiles;
    genomeNew[genomeID]["genomeannotation"] = [annotationFiles];
    return genomeNew;
  }
  
  async function fetchReplicateFiles(organism, replicate, index) {
    const typesOfFiles = ["enrichedforward", "enrichedreverse", "normalforward", "normalreverse"];
    // Deep copy replicate object
    let replicateNew = Object.assign({}, replicate);
    // Get key of object
    const genomeID = Object.keys(replicate)[0];
    for (let replicate of replicateNew[genomeID]) {
      for (let  value of Object.values(replicate)) {
        for (let typeOfFile of typesOfFiles) {
          let fileName = value[typeOfFile];
          // Fetching logic for replicate files...
          const response = await fetch(`/api/exampleData/${organism}/files/${fileName}/`);
          const blob = await response.blob();
          const file = new File([blob], fileName);
          value[typeOfFile] = file;
        }
      }
    }
    return replicateNew;
  }
    
  
  async function fetchAlignmentFile(organism, fileName) {
    const response = await fetch(`/api/exampleData/${organism}/files/${fileName}/`);
    const blob = await response.blob();
    setAlignmentFile(new File([blob], fileName));
  }
  

  return (
    <div>
      {ePopup && (
        <Error
          error={error}
          header={eHeader}
          onCancel={() => setEPopup(!ePopup)}
          onRun={(e) => handleSubmit(e, false)}
          sendAlignmentFile={() => sendAlignmentFile()}
        />
      )}
      {confPopup && (
        <LoadConfig
          text={text}
          header={confHeader}
          uploadConfig={(e) => uploadConfig(e)}
          uploadFiles={(e) => uploadConfFiles(e)}
        />
      )}

      <Header loading={loading} onLoadExampleData={loadExampleData} />

      <FormConfig projectName={projectName}
        setProjectName={setProjectName}
        parameters={parameters}
        handleParameters={handleParameters}
        saveAlignmentFile={saveAlignmentFile}
        alignmentFile={alignmentFile}
        genomes={genomes}
        replicates={replicates}
        handleTabs={handleTabs}
        numRep={numRep}
        saveFiles={saveFiles}
        saveIndividualFile={saveIndividualFile}
        saveAnnotationFile={saveAnnotationFile}
        showGName={showGName}
        multiFasta={multiFasta}
        parameterPreset={parameterPreset}
        handleParameterPreset={handleParameterPreset}
        rnaGraph={rnaGraph}
        setRnaGraph={setRnaGraph}
        setConfHeader={setConfHeader}
        setText={setText}
        setConfPopup={setConfPopup}
        saveConfigFile={saveConfigFile}
        loading={loading}
        handleSubmit={handleSubmit}/>
    </div>
  );
}

export default Main;




