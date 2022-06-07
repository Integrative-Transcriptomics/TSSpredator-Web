import React, { useState, useEffect } from 'react';
import ParameterGroup from './Main/ParameterGroup';
import ParameterAllGroups from './Main/ParameterAllGroups';
import Tabs from './Main/Tabs';
import '../css/Tabs.css';
import '../css/App.css';
import '../css/Grid.css';
import '../css/DragDrop.css';
import Error from './Main/Error';

/**
 * creates the main window and saves all inputs
*/
function Main() {

    const [projectName, setProjectName] = useState("");
    const [parameters, setParameters] = useState([{}]);
    const [parameterPreset, setParameterPreset] = useState("default");
    // checkbox
    const [rnaGraph, setRnaGraph] = useState(false);
    const [genomes, setGenomes] = useState([{ "genome1": { "name": "Condition_1", "placeholder": "Condition_1", "alignmentid": "", "outputid": "", "genomefasta": "", "genomeannotation": [] } }]);
    const [replicates, setReplicates] = useState([{ "genome1": [{ "replicatea": { "name": "Replicate a", "enrichedforward": "", "enrichedreverse": "", "normalforward": "", "normalreverse": "" } }] }]);
    const [alignmentFile, setAlignmentFile] = useState("");

    // new GenomeTab: use replicateTemplate to update replicates
    const [replicateTemplate, setReplicateTemplate] = useState([{ "replicatea": { "name": "Replicate a", "enrichedforward": "", "enrichedreverse": "", "normalforward": "", "normalreverse": "" } }]);
    // template für a single replicate
    const repTemplate = "{\"replicate0\":{\"name\":\"Replicate 0\", \"enrichedforward\":\"\", \"enrichedreverse\":\"\", \"normalforward\":\"\", \"normalreverse\":\"\"}}";
    // number of replicates
    const [numRep, setnumRep] = useState(1);
    // open/close parameters
    const [showParam, setShowParam] = useState(false);
    // show error popup
    const [ePopup, setEPopup] = useState(false);
    const [error, setError] = useState("");
    const [eHeader, seteHeader] = useState("ERROR");

    // show name of genom tab: set to true when genome names of alignment file are used
    const [showGName, setShowGName] = useState(false);


    /**
      * GETs Parameters from flask 
      */
    useEffect(() => {
        fetch("/parameters/")
            .then(res => res.json())
            .then(parameters => setParameters(parameters))
    }, []);

    /**
     * RUN Button event
     */
    const handleSubmit = (event, check = true) => {
        event.preventDefault();
        // if studytype condition: fill out alignment and output id
        fillGenomes();

        const run = checkInput();

        // run without annotation files
        if (!check) {
            run = true;
            // close popup from warning that no annotation files are given
            setEPopup(!ePopup);
        }
        if(run) {
            sendData();
        }
    }


    /**
    * if studytype: condition -> fill out alignment id and output id in genomes
    */
    const fillGenomes = () => {
        if (parameters.setup.typeofstudy.value === 'condition') {
            const temp = [...genomes];
            var outputId = temp[0]['genome1']['outputid']
            for (let i = 0; i < genomes.length; i++) {
                temp[i]['genome' + (i + 1)]['alignmentid'] = (i + 1);
                temp[i]['genome' + (i + 1)]['outputid'] = outputId;
            }
            setGenomes([...temp]);
        }
    }

    /**
     * check if input is correct
     */
    const checkInput = () => {

        seteHeader("ERROR");

        // check if project name is given
        if (projectName.length <= 0) {
            showError("Project Name is missing.");
            return false;
        }

        var studyType = "Genome";
        if (parameters.setup.typeofstudy.value === 'genome') {

            // check if at least 2 genomes are given
            if (genomes.length < 2) {
                showError("For the Comparison of different strains/species at least 2 Genomes are needed.");
                return false;
            }

            // check if alignmentFile is given and in the correct format
            if (alignmentFile.length <= 0) {
                showError("Alignment file in xmfa format is missing!");
                return false;
            } else if (alignmentFile.name.split('.')[1] !== 'xmfa') {
                showError("Alignment file has the wrong format. XMFA file format (.xmfa) is needed!");
                return false;
            }
        } else {
            studyType = "Condition";
        }

        // check if genome names and alignment IDS and output IDs are non-empty
        // check if fasta files are given and in the correct format
        var names = [];
        var alignmentIds = [];
        for (let i = 0; i < genomes.length; i++) {

            var tmpName = genomes[i]['genome' + (i + 1)]['name'];
            var tmpAlignmentId = genomes[i]['genome' + (i + 1)]['alignmentid'];
            var tmpOutputId = genomes[i]['genome' + (i + 1)]['outputid'];
            var tmpFasta = genomes[i]['genome' + (i + 1)]['genomefasta'];

            // genome name
            if (tmpName.length <= 0) {
                showError("Missing name for " + studyType + " " + (i + 1) + " . Click in the tab header and choose a unique name.");
                return false;
            } else {
                names.push(tmpName);
            }
            // alignment id
            if (tmpAlignmentId.length <= 0) {
                showError("Missing Alignment ID for " + studyType + " " + (i + 1) + ".");
                return false;
            } else {
                alignmentIds.push(tmpAlignmentId);
            }
            // output id
            if (tmpOutputId.length <= 0) {
                showError("Missing OutputID for " + studyType + " " + (i + 1) + ".");
                return false;
            }

            // fasta file 
            const fastaFormats = ['fasta', 'fna', 'ffn', 'faa', 'frn', 'fa'];
            if (i === 0 || (i > 0 && studyType === "Genome")) {
                if (tmpFasta.length <= 0) {
                    showError("Missing 'Genome FASTA' file for " + studyType + " " + (i + 1) + ".");
                    return false;
                } else {
                    const split = tmpFasta.name.split('.');
                    if (!fastaFormats.includes(split[split.length - 1])) {
                        showError("FASTA file for " + studyType + " " + (i + 1) + " has the wrong format. FASTA file format (.fasta, .fa, .fna, .ffn, .faa, .frn) is needed.");
                        return false;
                    }
                }
            }
        }
        // check if genome names and alingment IDS are unique
        const newNames = new Set(names);
        const newIds = new Set(alignmentIds);
        if (names.length !== newNames.size) {
            showError(studyType + " names are not unique.");
            return false;
        } else if (alignmentIds.length !== newIds.size) {
            showError("Alignment IDs are not unique.");
            return false;
        }

        // check replicate files
        for (let i = 0; i < replicates.length; i++) {

            const tmpG = replicates[i]['genome' + (i + 1)];

            for (let j = 0; j < tmpG.length; j++) {

                const letter = String.fromCharCode(97 + j);
                const tmpEF = tmpG[j]['replicate' + letter]['enrichedforward'];
                const tmpER = tmpG[j]['replicate' + letter]['enrichedreverse'];
                const tmpNF = tmpG[j]['replicate' + letter]['normalforward'];
                const tmpNR = tmpG[j]['replicate' + letter]['normalreverse'];

                if (!checkReplicateFiles(tmpEF, "Enrichment forward", studyType, i, j)) return false;
                if (!checkReplicateFiles(tmpER, "Enrichment reverse", studyType, i, j)) return false;
                if (!checkReplicateFiles(tmpNF, "Normal forward", studyType, i, j)) return false;
                if (!checkReplicateFiles(tmpNR, "Normal reverse", studyType, i, j)) return false;
            }
        }

        // check annotation files -> not neccessary, but warning needed
        for (let i = 0; i < genomes.length; i++) {
            var tmpAnnotation = genomes[i]['genome' + (i + 1)]['genomeannotation'];

            if (tmpAnnotation.length <= 0) {
                seteHeader("WARNING");
                showError("Missing 'Genome Annotation' file for " + studyType + " " + (i + 1) + ". This file is not required, but if no Annotation file is given, all TSS will be classified as orphan.");
                return false;
            } else {
                for (let j = 0; j < tmpAnnotation.length; j++) {
                    const split = tmpAnnotation[j].name.split('.');
                    if (!['gff', 'gtf'].includes(split[split.length - 1])) {
                        showError("Annotation file (number: " + (i + 1) + ") for " + studyType + " " + (i + 1) + " has the wrong format. GFF/GTF file format (.gff, .gtf) is needed.");
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * check if replicate files are given and in the correct format
     */
    const checkReplicateFiles = (file, errorName, studyType, idxGenome, idxRep) => {
        const repFormats = ['gr', 'wig'];
        if (file.length <= 0) {
            showError("Missing '" + errorName + "' graph file for Replicate " + String.fromCharCode(97 + idxRep) + " in " + studyType + " " + (idxGenome + 1) + ".");
            return false;
        } else {
            const split = file.name.split('.');
            if (!repFormats.includes(split[split.length - 1])) {
                showError(errorName + " graph file for Replicate  " + String.fromCharCode(97 + idxRep) + " in " + studyType + " " + (idxGenome + 1) + " has the wrong format. Wiggle file format (.gr, .wig) is needed.");
                return false;
            }
        }
        return true;
    }

    /**
     * post input data to flask
    */
    function sendData() {

        const formData = new FormData();

        for (let i = 0; i < genomes.length; i++) {
            const temp = genomes[i]['genome' + (i + 1)];

            formData.append('genomefasta', temp.genomefasta);
            // go over annotation array
            for (let k = 0; k < temp.genomeannotation.length; k++) {
                formData.append('genomeannotation' + (i + 1), temp.genomeannotation[k]);
            }

            const rep = replicates[i]['genome' + (i + 1)]

            for (let j = 0; j < rep.length; j++) {
                const letter = String.fromCharCode(97 + j);
                const temp1 = rep[j]['replicate' + letter];

                formData.append('enrichedforward', temp1.enrichedforward);
                formData.append('enrichedreverse', temp1.enrichedreverse);
                formData.append('normalforward', temp1.normalforward);
                formData.append('normalreverse', temp1.normalreverse);
            }
        }

        formData.append('projectname', JSON.stringify(projectName));
        formData.append('parameters', JSON.stringify(parameters));
        formData.append('rnagraph', JSON.stringify(rnaGraph));
        formData.append('genomes', JSON.stringify(genomes));
        formData.append('replicates', JSON.stringify(replicates));
        formData.append('replicateNum', JSON.stringify({ 'num': numRep }));

        formData.append('alignmentfile', alignmentFile);

        fetch('/input/', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.result === 'success') {
                    // open result in new tab
                    window.open('/result', '_blank', 'noopener,noreferrer');
                } else {
                    var error = (data.result);
                    var idx = error.indexOf('at');
                    if (idx > 0) {
                        error = error.slice(0, idx);
                    }
                    showError(error);
                }
            })
            .catch(err => console.log(err));
    }

    /**
     * save uploaded alignment file
     */
    const saveAlignmentFile = (e) => {
        setAlignmentFile(e.target.files[0]);

        // ask if file was created by mauve and than fill in genome names and ids
        seteHeader("INFO");
        showError("If the alignment has been generated with Mauve, genome names and IDs can be read from the file. Do you want to do this?");
    }

    /**
     * send alignment file to flask to read it 
     * get back json object of genome names and alignment ids
     */
    const sendAlignmentFile = () => {
        // close popup
        setEPopup(!ePopup);

        // send file to server
        const formData = new FormData();
        formData.append('alignmentFile', alignmentFile);
        fetch('/alignment/', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {

                if (data.result === 'success') {
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
            .catch(err => console.log(err));
    }

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
        }

        if (directParent === "setup") {
            updateSetupBox(name, 'value', val);
        } else {
            updateParameterBox(directParent, name, 'value', val);
            checkPreset(val, name);
        }
        if (name === "numberofreplicates") {
            updateReplicates(val);
        }
        if (name === "numberofgenomes") {
            updateGenomes(val);
        }
        if (name === 'stepfactor') {
            updateParameterBox(directParent, 'stepfactorreduction', 'max', val);
            if (parameters.parameterBox['Prediction']['stepfactorreduction']['value'] > val) {
                parameters.parameterBox['Prediction']['stepfactorreduction']['value'] = val;
            }
        }
        if (name === "stepheight") {
            updateParameterBox(directParent, 'stepheightreduction', 'max', val);
            if (parameters.parameterBox['Prediction']['stepheightreduction']['value'] > val) {
                parameters.parameterBox['Prediction']['stepheightreduction']['value'] = val;
            }
        }
        // update Genome/Condition label
        if (name === "typeofstudy") {

            if (val === "condition") {
                setShowGName(false);
            }

            const newName = "Number of " + val.charAt(0).toUpperCase() + val.slice(1) + "s";
            // Number of Genomes/Conditions
            updateSetupBox('numberofgenomes', 'name', newName);

            // Genome/Condition Tabs
            genomes.forEach((g, i) => {
                g['genome' + (i + 1)].placeholder = val.charAt(0).toUpperCase() + val.slice(1) + "_" + (i + 1);
                g['genome' + (i + 1)].name = val.charAt(0).toUpperCase() + val.slice(1) + "_" + (i + 1);
            })
            setGenomes([...genomes]);

            // allowed cross-genome/condition shift
            updateParameterBox('Comparative', 'allowedcrossgenomeshift', 'name', "allowed cross-" + val + " shift");
        }
    }

    /**
     * update number of replicates
     */
    const updateReplicates = (val) => {
        setnumRep(val);
        // update maximum of Parameter 'matching replicates'
        updateParameterBox('Comparative', 'matchingreplicates', 'max', val);

        const numRep = replicateTemplate.length;

        // replicate added
        if (val > numRep) {

            // add all needed replicates
            for (let i = numRep + 1; i <= val; i++) {

                const repLetter = String.fromCharCode(96 + i);
                const newRep = JSON.parse(repTemplate.replaceAll('0', repLetter));

                // update replicate template
                replicateTemplate.push(newRep);
                setReplicateTemplate(replicateTemplate);
                // update replicates 
                for (let j = 0; j < replicates.length; j++) {
                    replicates[j]['genome' + (j + 1)].push(newRep);
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
                    replicates[j]['genome' + (j + 1)].pop();
                }
                setReplicates(replicates);
            }
        }
    }

    /**
     * update number of genomes 
     * @param val: the new number of genomes
     * @param data: object with genome names and ids from the alignment file
     */
    const updateGenomes = (val, data) => {

        parameters.setup.numberofgenomes.value = val;

        // add genom tab
        const numGenomes = Object.keys(genomes).length;
        if (val > numGenomes) {

            // add all needed genomes
            for (let i = numGenomes + 1; i <= val; i++) {
                var genomeName = (parameters.setup.typeofstudy.value).charAt(0).toUpperCase() + (parameters.setup.typeofstudy.value).slice(1) + "_" + i;
                var placeholder = (parameters.setup.typeofstudy.value).charAt(0).toUpperCase() + (parameters.setup.typeofstudy.value).slice(1) + "_" + i;

                var alignmentID = "";
                if (typeof data !== 'undefined') {
                    genomeName = data['genome_' + i];
                    alignmentID = data['id_' + i];
                }

                genomes.push({
                    ["genome" + i]: { name: genomeName, placeholder: placeholder, alignmentid: alignmentID, outputid: "", genomefasta: "", genomeannotation: [] }
                });
                setGenomes(genomes);
                // add new genome to replicates
                replicates.push({ ["genome" + i]: [...replicateTemplate] });
                setReplicates(replicates);
            }
            // update genome names and alignmetn ids
            if (typeof data !== 'undefined') {
                for (let i = 0; i < numGenomes; i++) {
                    genomes[i]["genome" + (i + 1)]['name'] = data['genome_' + (i + 1)];
                    genomes[i]["genome" + (i + 1)]['alignmentid'] = data['id_' + (i + 1)];
                }
            }

            // remove genome tab   
        } else if (val < numGenomes && val > 0) {
            // remove all genomes
            const difference = numGenomes - val;
            for (let i = 0; i < difference; i++) {
                // remove last genome
                genomes.pop();
                setGenomes(genomes);
                // remove genome from replicates
                replicates.pop();
                setReplicates(replicates);
            }
            // update genome names and alignment ids
            if (typeof data !== 'undefined') {
                for (let i = 0; i < val; i++) {
                    genomes[i]["genome" + (i + 1)]['name'] = data['genome_' + (i + 1)];
                    genomes[i]["genome" + (i + 1)]['alignmentid'] = data['id_' + (i + 1)];
                }
            }
        }
    }
    /**
    * update parameter value in setup box
    */
    const updateSetupBox = (node, element, value) => {
        setParameters(current => (
            {
                ...current,
                setup: {
                    ...current.setup,
                    [node]: { ...current.setup[node], [element]: value }
                }
            }));
    }
    /**
     * update parameter value in parameter box
     */
    const updateParameterBox = (parent, node, element, value) => {
        setParameters(current => (
            {
                ...current,
                parameterBox: {
                    ...current.parameterBox,
                    [parent]: {
                        ...current.parameterBox[parent],
                        [node]: { ...current.parameterBox[parent][node], [element]: value }
                    }
                }
            }));
    }

    /**
     * checks of parameter preset for current parameter values exists
     */
    const checkPreset = (value, parameterName) => {
        const names = ['stepheight', 'stepheightreduction', 'stepfactor', 'stepfactorreduction', 'enrichmentfactor', 'processingsitefactor'];
        const values = ['default', 'more sensitive', 'more specific', 'very sensitive', 'very specific'];
        const match = [];

        if (!names.includes(parameterName)) { return; }

        values.forEach((val) => {
            const v = val.replace(' ', '')
            // matches changed parameter value with parameter preset
            if (parameters.parameterBox.Prediction[parameterName][v] === value) {
                match.push(val);
            }
        })

        // check remaining parameters
        if (match.length === 0) {
            setParameterPreset('custom');
        } else {
            names.forEach((name) => {
                if (name !== parameterName) {
                    match.forEach((mat) => {
                        const v = mat.replace(' ', '');
                        if (parameters.parameterBox.Prediction[name][v] !== parameters.parameterBox.Prediction[name].value) {
                            match.pop(mat);
                        }
                    })
                }
            })
        }
        if (match.length !== 0) {
            setParameterPreset(match[0]);
        }
    }

    /**
     * updates parameters according to the chosen parameter preset
     */
    const handleParameterPreset = (event) => {
        setParameterPreset(event.target.value);
        const preset = (event.target.value).replace(' ', '');

        if (typeof parameters.parameterBox !== 'undefined' && event.target.value !== 'custom') {
            const names = ['stepheight', 'stepheightreduction', 'stepfactor', 'stepfactorreduction', 'enrichmentfactor', 'processingsitefactor'];
            names.forEach((name) => {
                updateParameterBox('Prediction', name, 'value', parameters.parameterBox.Prediction[name][preset]);
            })
        }
    }

    /**
     * updates text input in genome tabs
     */
    const handleTabs = (event) => {

        setShowGName(true);

        const name = event.target.name;
        const value = event.target.value;
        const id = parseInt(event.target.id);

        let temp = [...genomes];
        temp[id]['genome' + (id + 1)][name] = value;
        setGenomes([...temp]);
    }

    /**
     * saves an individual file from genome & replicate tabs
     */
    const saveIndividualFile = (event) => {

        const node = event.target.name;
        const id = event.target.id;
        const file = event.target.files[0];

        // replicate
        if (id.length > 5) {
            saveReplicates(parseInt(id[0]), parseInt(id[2]), node, file);
            // genome
        } else {
            saveGenomes(parseInt(id[0]), node, file);
        }
    }

    /**
    * saves individual uploaded annotation file(s)
    */
    const saveAnnotationFile = (event) => {

        const node = event.target.name;
        const id = parseInt(event.target.id[0]);
        const temp = [...genomes];
        const tmpArray = [];

        for (let i = 0; i < (event.target.files).length; i++) {
            tmpArray.push(event.target.files[i]);
        }

        temp[id]['genome' + (id + 1)][node] = tmpArray;
        setGenomes([...temp]);
    }

    /** 
     * saves files that are uploaded over 'upload all files together' button
     */
    const saveFiles = (genomeFiles, enrichFor, enrichRev, normalFor, normalRev, genomeIdx) => {

        saveGenomes(genomeIdx, 'genomefasta', genomeFiles.genomefasta);
        saveGenomes(genomeIdx, 'genomeannotation', genomeFiles.genomeannotation);

        Object.keys(enrichFor).forEach((key) => {
            saveReplicates(genomeIdx, parseInt(key), 'enrichedforward', enrichFor[key]);
        });
        Object.keys(enrichRev).forEach((key) => {
            saveReplicates(genomeIdx, parseInt(key), 'enrichedreverse', enrichRev[key]);
        });
        Object.keys(normalFor).forEach((key) => {
            saveReplicates(genomeIdx, parseInt(key), 'normalforward', normalFor[key]);
        });
        Object.keys(normalRev).forEach((key) => {
            saveReplicates(genomeIdx, parseInt(key), 'normalreverse', normalRev[key]);
        });
    }

    /**
     * saves genome files
     */
    const saveGenomes = (gId, node, file) => {
        const temp = [...genomes];
        temp[gId]['genome' + (gId + 1)][node] = file;
        setGenomes([...temp]);
    }

    /**
     * saves replicate files
     * gId: genome index
     * rId: replicate index
     */
    const saveReplicates = (gId, rId, node, file) => {
        const replicate = 'replicate' + String.fromCharCode(97 + rId);

        let newValue = { ...replicates[gId]['genome' + (gId + 1)][rId][replicate] };
        newValue[node] = file;
        let temp = [...replicates];
        temp[gId]['genome' + (gId + 1)][rId] = { [replicate]: newValue };
        setReplicates([...temp]);
    }

    /**
   * popup window with error
   */
    const showError = (error) => {
        setError(error);
        setEPopup(!ePopup);
    }

    /**
     * upload config file
     */
    const loadConfigFile = (event) => {

        const file = event.target.files[0];
        // check if config file
        const split = file.name.split('.');
        if (split[split.length - 1] !== 'config') {
            showError('Config File has wrong format. Config file format (.config) needed.')
        } else {

            // send config file to server
            const formData = new FormData();
            formData.append('configFile', file);
            formData.append('parameters', JSON.stringify(parameters));
            formData.append('genomes', JSON.stringify(genomes));
            formData.append('replicates', JSON.stringify(replicates));
            fetch('/loadConfig/', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {

                    if (data.result === 'success') {
                        var result = data.data
                        setProjectName(result['projectName']);
                        setGenomes(JSON.parse(result['genomes']));
                        setReplicates(JSON.parse(result['replicates']));
                        setParameters(JSON.parse(result['parameters']));
                        setRnaGraph((result['rnaGraph'] === 'true'));
                        setAlignmentFile(result['alignmentFile']);
                        setShowGName(true);

                        var newRepNum = parseInt(result['numReplicate']);
                        // update replicate template
                        if (newRepNum > numRep) {
                            for (let i = numRep; i < newRepNum; i++) {
                                const repLetter = String.fromCharCode(96 + i);
                                const newRep = JSON.parse(repTemplate.replaceAll('0', repLetter));
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
                    } else {
                        showError(data.data);
                    }
                })
                .catch(err => console.log(err));
        }
    }

    /**
     * save input in config file
     */
    const saveConfigFile = () => {

        // send input parameters to server
        const formData = new FormData();
        formData.append('projectname', JSON.stringify(projectName));
        formData.append('parameters', JSON.stringify(parameters));
        formData.append('rnagraph', JSON.stringify(rnaGraph));
        formData.append('genomes', JSON.stringify(genomes));
        formData.append('replicates', JSON.stringify(replicates));
        formData.append('replicateNum', JSON.stringify({ 'num': numRep }));
        fetch('/saveConfig/', {
            method: 'POST',
            body: formData
        })
            .then(response => response.blob())
            .then((blob) => {

                var name = projectName + '.config';

                // Create blob link to download
                const url = window.URL.createObjectURL(
                    new Blob([blob]),
                );
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute(
                    'download',
                    name,
                );

                // Append to html link element page
                document.body.appendChild(link);

                // Start download
                link.click();

                // Clean up and remove the link
                link.parentNode.removeChild(link);
            })
            .catch(err => console.log(err));
    }

    return (
        <div>
            {ePopup && <Error error={error} header={eHeader} onCancel={() => setEPopup(!ePopup)} onRun={(e) => handleSubmit(e, false)} sendAlignmentFile={() => sendAlignmentFile()} />}

            <header>
                <h1>TSSpredator</h1>
            </header>

            <div className='form-container'>
                <div className='content-box'>
                    <label >
                        <input className='project-name' type="text" name="project-name" placeholder="Enter Project Name" defaultValue={projectName} onChange={(e) => setProjectName(e.target.value)} />
                    </label>
                    {(typeof parameters.setup === 'undefined') ? (<p></p>) : (<ParameterGroup parameters={parameters.setup} grid={false} onChange={(e) => handleParameters(e)} />)}
                </div>

                <div className='content-box'>
                    <h3 className='header'>Upload Data</h3>
                    <div className='margin-left'>
                        {(typeof parameters.setup === 'undefined')
                            ? <></>
                            : <>
                                <div className={parameters.setup.typeofstudy.value === "genome" ? 'file-box-align' : 'file-box-align vis-hidden'} title='Select the xmfa alignment file containing the aligned genomes.'>
                                    <p className='file-row'>Alignment File</p>
                                    <label className='element-row file-row' htmlFor='alignment-file'>
                                        <input className='element hidden' type="file" id='alignment-file' onChange={(e) => saveAlignmentFile(e)} />
                                        <p className='button'>Select File</p>
                                        {alignmentFile.length <= 0 ? <p className='file-name'>No file selected.</p> : <p className='file-name'>{alignmentFile.name}</p>}
                                    </label>
                                </div>

                                <Tabs genomes={genomes} genome={true} replicates={replicates} studyType={parameters.setup.typeofstudy.value}
                                    handleTabs={(e) => handleTabs(e)} numRep={numRep} saveFiles={(g, ef, er, nf, nr, idx) => saveFiles(g, ef, er, nf, nr, idx)}
                                    saveIndividualFile={(e) => saveIndividualFile(e)} saveAnnotationFile={(e) => saveAnnotationFile(e)} showName={showGName} />
                            </>
                        }
                    </div>
                </div>

                <div className='content-box'>
                    <h3 className='header click-param' onClick={(e) => setShowParam(!showParam)}>+ Parameters</h3>

                    <div className={showParam ? 'show margin-left file-column' : 'hidden'}>

                        <div className='element-row'>
                            <label className='element preset-label' htmlFor='preset'> parameter preset</label>
                            <select className='param-preset' value={parameterPreset} name="parameter-preset" id='preset' onChange={(e) => handleParameterPreset(e)}>
                                <option value="custom">custom</option>
                                <option value="very specific">very specific</option>
                                <option value="more specific">more specific</option>
                                <option value="default">default</option>
                                <option value="more sensitive">more sensitive</option>
                                <option value="very sensitive">very sensitive</option>
                            </select>

                            <input type="checkbox" name="rna-seq-graph" id='check' checked={rnaGraph} onChange={() => setRnaGraph(!rnaGraph)}
                                data-title="If this option is enabled, the normalized RNA-seq graphs are written. Note that writing the graphs will increase the runtime." />
                            <label className='element checkbox' htmlFor='check'
                                data-title="If this option is enabled, the normalized RNA-seq graphs are written. Note that writing the graphs will increase the runtime.">write rna-seq graph</label>
                        </div>

                        {(typeof parameters.parameterBox === 'undefined')
                            ? (<p></p>)
                            : (<ParameterAllGroups parameterGroups={parameters.parameterBox} grid={true} onChange={(e) => handleParameters(e)} />)}
                    </div>
                </div>


                <div className='footer'>
                    <label className='button load'>
                        <input type="file" style={{ display: 'none' }} onChange={(e) => loadConfigFile(e)} />
                        Load
                    </label>
                    <p>or</p>
                    <button className='button save' type="button" onClick={() => saveConfigFile()}>Save</button>
                    <p>Configuration</p>
                    <button className='button run' type="button" onClick={(e) => handleSubmit(e)}>Start TSS prediction</button>
                </div>

            </div>
        </div>
    )
}

export default Main