import React, { useState, useEffect } from "react";
import "../css/Tabs.css";
import "../css/App.css";
import "../css/Grid.css";
import "../css/DragDrop.css";
import Error from "./Main/Error";
import LoadConfig from "./Main/LoadConfig";
import FormConfig from "./Main/ParameterInputField";
import Header from "./Main/Header";
import JSZip from "jszip";
import LoadingBanner from "./Main/LoadingBanner";
import ZipUpload from "./Main/ZipUpload";

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
  const [uploadZip, setUploadZip] = useState(false);
  const [text, setText] = useState("");
  const [confHeader, setConfHeader] = useState("Upload Config File");
  const [confFile, setConfFile] = useState("");

  // show name of genom tab: set to true when genome names of alignment file are used
  const [showGName, setShowGName] = useState(false);

  // loading spinner [runButton, loadExampleData]
  const [loading, setLoading] = useState([false, false]);

  const [loadingFiles, setLoadingFiles] = useState({});
  const [statusID, setStatusID] = useState(false);
  const [readyLoaded, setReadyLoaded] = useState(false);


  const PARAMETER_NAMES = [
    "stepheight",
    "stepheightreduction",
    "stepfactor",
    "stepfactorreduction",
    "enrichmentfactor",
    "processingsitefactor",
  ];
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
  const handleSubmit = async (event, check = true) => {

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
      await fetch(`/api/startUpload/`)
      const promises = sendDataAsync();
      let uploadedFiles = await Promise.all(promises)
      let modifiedGenomes = []
      let modifiedReplicates = []
      genomes.forEach((genome, i) => {
        // deep copy of genome
        let tempGenome = JSON.parse(JSON.stringify(genome))
        let tempReplicate = {}
        const genomeID = `genome${i + 1}`
        let resultsFiltered = uploadedFiles.filter((file) => file.fileCategory.includes(genomeID))
        let genomeFiles = resultsFiltered.filter((file) => file.fileCategory.includes("genomefasta"))
        let genomeAnnotation = resultsFiltered.filter((file) => file.fileCategory.includes("genomeannotation"))[0]
        tempGenome[genomeID].genomefasta = genomeFiles[0].fileName
        tempGenome[genomeID].genomeannotation = genomeAnnotation.fileName
        for (let j = 0; j < replicates[i][genomeID].length; j++) {
          const replicateID = `replicate${String.fromCharCode(97 + j)}`
          tempReplicate[replicateID] = {}
          let replicateFiles = resultsFiltered.filter((file) => file.fileCategory.includes(replicateID))
          tempReplicate[replicateID].enrichedforward = replicateFiles.filter((file) => file.fileCategory.includes("enrichedforward"))[0].fileName
          tempReplicate[replicateID].enrichedreverse = replicateFiles.filter((file) => file.fileCategory.includes("enrichedreverse"))[0].fileName
          tempReplicate[replicateID].normalforward = replicateFiles.filter((file) => file.fileCategory.includes("normalforward"))[0].fileName
          tempReplicate[replicateID].normalreverse = replicateFiles.filter((file) => file.fileCategory.includes("normalreverse"))[0].fileName
        }
        modifiedGenomes.push(tempGenome)
        let replicateObj = {}
        replicateObj[`${genomeID}`] = tempReplicate
        modifiedReplicates.push(replicateObj)
      })

      let formData = new FormData()
      let formBody = {
        "projectName": projectName,
        "parameters": parameters,
        "rnaGraph": rnaGraph,
        "genomes": modifiedGenomes,
        "replicates": modifiedReplicates,
        "replicateNum": numRep
      }
      if (alignmentFile) {
        formBody["alignmentFile"] = alignmentFile.name
      }
      formData.append("data", JSON.stringify(formBody));

      fetch("/api/runAsync/", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          setLoading([false, false]);

          if (data.result === "success") {
            setStatusID(data.id);
            setReadyLoaded("loaded");



          } else {
            console.log(data);
          }
        })




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


  async function uploadFile(file, fileCategory) {
    function wait(delay) {
      return new Promise((resolve) => setTimeout(resolve, delay));
    }

    function fetchRetry(url, delay, tries, fetchOptions = {}) {
      function onError(err) {
        console.log(fetchOptions.body)
        let triesLeft = tries - 1;
        if (!triesLeft) {
          console.log("No more tries left");
          throw err;
        }
        return wait(delay).then(() => fetchRetry(url, delay, triesLeft, fetchOptions));
      }
      return fetch(url, fetchOptions).catch(onError);
    }
    const fileName = file.name;
    const formData = new FormData();

    updateLoadingFiles(fileName, false)
    formData.append("fileCategory", fileCategory);
    formData.append("fileType", fileCategory.includes("annotation") ? "annotation" : "input");
    formData.append("fileName", fileName);
    formData.append("file", file);
    // send file to server
    return fetchRetry("/api/upload/", 2, 3, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        updateLoadingFiles(fileName, "success")
        return response.json()
      })
      .catch((err) => {
        console.log(err);
        updateLoadingFiles(fileName, "error")
      });



  }

  /**
   * Sends data to the server using a POST request.
   * @function sendDataAsync
   * @returns {void}
   */
  function sendDataAsync() {
    setReadyLoaded("loading");
    const typesOfReplicates = ["enrichedforward", "enrichedreverse", "normalforward", "normalreverse"];
    let promises = [];
    genomes.forEach((genome, i) => {
      let idGenome = `genome${i + 1}`
      const { genomefasta, genomeannotation } = genome[idGenome];
      promises.push(uploadFile(genomefasta, `${idGenome}_genomefasta`));
      genomeannotation.forEach((annotation, k) => {
        promises.push(uploadFile(annotation, `${idGenome}_genomeannotation${i + 1}`));
      });
      const rep = replicates[i][idGenome];
      rep.forEach((replicate, j) => {
        const letter = String.fromCharCode(97 + j);
        const replicateID = `replicate${letter}`
        const { enrichedforward, enrichedreverse, normalforward, normalreverse } = replicate[replicateID];
        let replicateFiles = [enrichedforward, enrichedreverse, normalforward, normalreverse];
        replicateFiles.forEach((file, k) => {
          promises.push(uploadFile(file, `${idGenome}_${replicateID}_${typesOfReplicates[k]}`));
        });
      });
    });

    if (alignmentFile) promises.push(uploadFile(alignmentFile, "alignmentfile"));
    return promises
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

  const updateReplicateGenomes = (key) => {
    let functionUpdates = {
      "numberofreplicates": updateReplicates,
      "numberofgenomes": updateGenomes
    }
    return functionUpdates[key]

  }
  /**
   * update useState of changed paramter p
   * if other parameters are dependend on p they are also updated
   */
  const handleParameters = (event) => {
    const { name, id: directParent } = event.target;
    const { value, valueAsNumber } = event.target;
    const checkingTypeOrCluster = ["typeofstudy", "clustermethod"].includes(name)
    let val = checkingTypeOrCluster ? value : valueAsNumber;
    if (!checkingTypeOrCluster)
      if (isNaN(val)) return;

    if (["numberofreplicates", "numberofgenomes"].includes(name)) {
      updateReplicateGenomes(name)(val)
    }
    else if (["stepfactor", "stepheight"].includes(name)) {
      let keyValue = name === "stepfactor" ? "stepfactorreduction" : "stepheightreduction"
      updateParameterBox("Prediction", keyValue, "max", val);
      if (parameters.parameterBox["Prediction"][keyValue]["value"] > val) {
        parameters.parameterBox["Prediction"][keyValue]["value"] = val;
      }

    }
    else if (name === "typeofstudy") { // update Genome/Condition label
      setShowGName(!(val === "condition"));
      const placeholderGenomeOrReplicate = `${val.charAt(0).toUpperCase()}${val.slice(1)}`;
      const newName = `Number of ${placeholderGenomeOrReplicate}s`;
      // Number of Genomes/Conditions
      updateSetupBox("numberofgenomes", "name", newName);
      // Genome/Condition Tabs
      genomes.forEach((g, i) => {
        let index = i + 1;
        let genomeKey = `genome${index}`;
        let defaultName = `${placeholderGenomeOrReplicate}_${index}`;
        g[genomeKey].placeholder = defaultName
        g[genomeKey].name = defaultName
      });
      setGenomes([...genomes]);

      // allowed cross-genome/condition shift
      updateParameterBox(
        "Comparative",
        "allowedcrossgenomeshift",
        "name",
        `allowed cross-${val} shift`
      );
    }
    if (directParent === "setup") {
      updateSetupBox(name, "value", val);
    } else {
      updateParameterBox(directParent, name, "value", val);
      checkPreset(val, name);
    }

  };

  /**
   * update number of replicate tabs
   */
  const updateReplicates = (val) => {
    setnumRep(val);
    updateParameterBox("Comparative", "matchingreplicates", "max", val);

    const numRep = replicateTemplate.length;

    // replicate added
    if (val > numRep) {
      const newReplicates = Array.from({ length: val - numRep }, (_, i) => {
        const repLetter = String.fromCharCode(97 + numRep + i);
        return JSON.parse(repTemplate.replaceAll("0", repLetter));
      });

      setReplicateTemplate(prevTemplate => [...prevTemplate, ...newReplicates]);

      setReplicates(prevReplicates => prevReplicates.map(replicate => {
        return {
          ...replicate,
          ["genome" + (prevReplicates.indexOf(replicate) + 1)]: [...replicate["genome" + (prevReplicates.indexOf(replicate) + 1)], ...newReplicates]
        };
      }));
    }
    // replicate removed
    else if (val < numRep && val > 0) {
      setReplicateTemplate(prevTemplate => prevTemplate.slice(0, val));

      setReplicates(prevReplicates => prevReplicates.map(replicate => {
        return {
          ...replicate,
          ["genome" + (prevReplicates.indexOf(replicate) + 1)]: replicate["genome" + (prevReplicates.indexOf(replicate) + 1)].slice(0, val)
        };
      }));
    }
  };

  /**
   * update number of genome tabs
   * @param val: the new number of genomes
   * @param data: object with genome names and ids from the alignment file
   */
  const updateGenomes = (val, data) => {
    setParameters(prevParameters => ({
      ...prevParameters,
      setup: {
        ...prevParameters.setup,
        numberofgenomes: {
          ...prevParameters.setup.numberofgenomes,
          value: val,
        },
      },
    }));

    const numGenomes = genomes.length;

    // add genome tab
    if (val > numGenomes) {
      const newGenomes = Array.from({ length: val - numGenomes }, (_, i) => {
        const index = numGenomes + i + 1;
        const { value: studyType } = parameters.setup.typeofstudy;
        const studyTypeCapitalized = `${studyType.charAt(0).toUpperCase()}${studyType.slice(1)}`;
        const placeholder = `${studyTypeCapitalized}_${index}`;
        let genomeName = placeholder;

        let alignmentID = "";
        if (data) {
          genomeName = data[`genome_${index}`];
          alignmentID = data[`id_${index}`];
        }

        return {
          [`genome${index}`]: {
            name: genomeName,
            placeholder: placeholder,
            alignmentid: alignmentID,
            outputid: "",
            genomefasta: "",
            genomeannotation: [],
          },
        };
      });

      setGenomes(prevGenomes => [...prevGenomes, ...newGenomes]);
      setMultiFasta(prevMultiFasta => [...prevMultiFasta, ...new Array(val - numGenomes).fill(false)]);
      setReplicates(prevReplicates => [...prevReplicates, ...newGenomes.map(() => ({ [`genome${numGenomes + 1}`]: [...replicateTemplate] }))]);
    }
    // remove genome tab
    else if (val < numGenomes && val > 0) {
      setGenomes(prevGenomes => prevGenomes.slice(0, val));
      setMultiFasta(prevMultiFasta => prevMultiFasta.slice(0, val));
      setReplicates(prevReplicates => prevReplicates.slice(0, val));
    }
    // data from alignment file
    else if (val === numGenomes && data) {
      setGenomes(prevGenomes => prevGenomes.map((genome, i) => {
        const genomeKey = `genome${i + 1}`;
        const dataKey = `genome_${i + 1}`;
        if (genome[genomeKey]) {
          return {
            ...genome,
            [genomeKey]: {
              ...genome[genomeKey],
              name: data[dataKey],
              alignmentid: data[dataKey],
            },
          };
        }
        return genome;
      }));
    }
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
    const preset_names = [
      "default",
      "more sensitive",
      "more specific",
      "very sensitive",
      "very specific",
    ];

    if (!PARAMETER_NAMES.includes(parameterName)) {
      return;
    }
    // Find if any of the preset values match the current values
    let match = preset_names.filter(val => parameters.parameterBox.Prediction[parameterName][val.replace(" ", "")] === value);

    if (match.length === 0) {
      setParameterPreset("custom");
    } else {
      // For the other values, check if they match the current values of the preset
      PARAMETER_NAMES.forEach(name => {
        if (name !== parameterName) {
          match = match.filter(mat => parameters.parameterBox.Prediction[name][mat.replace(" ", "")] === parameters.parameterBox.Prediction[name].value);
        }
      });
      if (match.length !== 0)
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
      PARAMETER_NAMES.forEach((name) => {
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

    let listObjects = [enrichFor, enrichRev, normalFor, normalRev];
    let listNames = ["enrichedforward", "enrichedreverse", "normalforward", "normalreverse"];
    listObjects.forEach((obj, i) => {
      Object.keys(obj).forEach((key) => {
        if (obj[key].name) {
          saveReplicates(genomeIdx, parseInt(key), listNames[i], obj[key]);
        }
      });
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
    console.log(split)
    if (split[split.length - 1] !== "config" && split[split.length - 1] !== "json") {
      setConfPopup(false);
      showError("Config File has wrong format. Config file format (.config) or JSON needed.");
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
    let filesOK = true;
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
      let genomeID = "genome" + (i + 1);
      let currentObject = new_genomes[i][genomeID];
      var tmpFasta = currentObject["genomefasta"];
      var tmpAnnotation = currentObject["genomeannotation"];
      new_genomes[i][genomeID]["genomeannotation"] = [];

      for (let j = 0; j < allFiles.length; j++) {
        if (allFiles[j].name === tmpFasta) {
          new_genomes[i][genomeID]["genomefasta"] = allFiles[j];
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
              new_genomes[i][genomeID]["genomeannotation"].push(allFiles[j]);
            }
            // single annotation file
          } else if (allFiles[j].name === tmpAnnotation) {
            new_genomes[i][genomeID]["genomeannotation"] = [allFiles[j]];
          }
        }
      }
    }

    // assign uploaded files to replicates
    for (let i = 0; i < new_replicates.length; i++) {
      var tmpG = new_replicates[i]["genome" + (i + 1)];
      console.log(tmpG)
      for (let k = 0; k < tmpG.length; k++) {
        const letter = String.fromCharCode(97 + k);
        const replicateKey = "replicate" + letter;
        let listKeys = ["enrichedforward", "enrichedreverse", "normalforward", "normalreverse"];
        listKeys.forEach((key) => {
          let tmpFile = tmpG[k][replicateKey][key];
          // find index of file in allFiles with matching and assign it to the replicate
          let file = allFiles.find((f) => f.name === tmpFile);
          if (file) {
            tmpG[k][replicateKey][key] = file;
          }
        });
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

  const blobFiles = async (files) => {
    let promises = Object.keys(files).map(key => {
      return files[key].async("blob").then(blob => {
        return { key, blob };
      });
    });

    let results = await Promise.all(promises);
    let blobFiles = {};
    results.forEach(({ key, blob }) => {
      blobFiles[key] = blob;
    });

    return blobFiles;
  }


  const fetchDataServer = async (jsonConfig, organism) => {
    const fetchDataTogether = await fetch(`/api/fetchData/${organism}/`)
    let unzippedData = new JSZip();
    let zipFile = await unzippedData.loadAsync(fetchDataTogether.blob()).then(function (zip) {
      return blobFiles(zip["files"]);
    })
    const genomeData = jsonConfig["genomes"].map((genome, i) => getGenomeFiles(genome, i, zipFile))
    const replicateData = jsonConfig["replicates"].map((replicate) => getReplicateFiles(replicate, zipFile));
    // Fetch alignment file if provided
    if (jsonConfig["alignmentFile"]) {
      const alignmentFileName = jsonConfig["alignmentFile"];
      const alignmentFile = zipFile[alignmentFileName];
      setAlignmentFile(new File([alignmentFile], alignmentFileName));
    }
    return { "genomes": genomeData, "replicates": replicateData }

  }
  const closePopup = () => {
    setReadyLoaded(false);
    setLoadingFiles({});
  }

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

      const dataServer = await fetchDataServer(jsonConfig, organism)
      let genomes = dataServer["genomes"]
      let replicates = dataServer["replicates"]
      setGenomes(genomes);
      setShowGName(true);
      setReplicates(replicates);
      updateReplicateTemplate(parseInt(jsonConfig["numReplicates"]));

      // Convert multiFasta strings to boolean
      const multiFasta = jsonConfig["multiFasta"].map(s => s === "true");
      setMultiFasta(multiFasta);
    } catch (error) {
      console.error('Error loading example data:', error);
    } finally {
      setLoading([false, false]);
    }
  };

  function getGenomeFiles(genome, index, zipFile) {
    const genomeID = "genome" + (index + 1);
    const { genomefasta: genomefileName, genomeannotation: annotationfileName } = genome[genomeID];

    const responseGenome = zipFile[genomefileName];
    const responseAnnotation = zipFile[annotationfileName];

    return {
      ...genome,
      [genomeID]: {
        ...genome[genomeID],
        genomefasta: new File([responseGenome], genomefileName),
        genomeannotation: [new File([responseAnnotation], annotationfileName)],
      },
    };
  }

  function getReplicateFiles(replicate, zipFile) {
    const typesOfFiles = ["enrichedforward", "enrichedreverse", "normalforward", "normalreverse"];
    // Deep copy replicate object
    let replicateNew = Object.assign({}, replicate);
    // Get key of object
    const genomeID = Object.keys(replicate)[0];
    for (let replicate of replicateNew[genomeID]) {
      for (let value of Object.values(replicate)) {
        for (let typeOfFile of typesOfFiles) {
          let fileName = value[typeOfFile];
          // Fetching logic for replicate files...
          let fileContent = zipFile[`${fileName}`]
          const file = new File([fileContent], fileName);
          value[typeOfFile] = file;
        }
      }
    }
    return replicateNew;
  }

  function updateLoadingFiles(fileName, status) {
    setLoadingFiles((prevLoadingFiles) => {
      // Using functional update form to ensure we're working with the latest state
      prevLoadingFiles[fileName] = status;
      return prevLoadingFiles
    });
  }

  useEffect(() => {
  }, [loadingFiles]);


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
          closePopup={() => setConfPopup(false)}
        />
      )}
      {uploadZip && (
        <ZipUpload closePopup={() => setUploadZip(false)} />
      )}
      {
        typeof readyLoaded === "string" && (
          <LoadingBanner
            statusID={statusID}
            listDocumentStatus={loadingFiles}
            readyLoaded={readyLoaded}
            closePopup={() => closePopup()}
          />
        )
      }

      <Header loading={loading} startZipUpload={(x) => setUploadZip(x)} onLoadExampleData={loadExampleData} showExamples={true} statusID={!statusID ? null : statusID} allowZipUpload={true} />

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
        fillGenomes={fillGenomes}
        checkInput={checkInput}
        loading={loading}
        handleSubmit={handleSubmit} />
    </div>
  );
}

export default Main;




