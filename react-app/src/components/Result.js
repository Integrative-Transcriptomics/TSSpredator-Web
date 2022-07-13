import React, { useState, useEffect } from 'react';
import ClipLoader from "react-spinners/ClipLoader";
import JSZip from 'jszip';
import '../css/Result.css';
import '../css/App.css';
import '../css/MasterTable.css';
import MasterTable from './Result/MasterTable';
import UpSet from './Result/UpSet';
import Histogramm from './Result/Histogramm';
import LineChart from './Result/LineChart';

/**
 * creates page that displays result of TSS prediction 
 */

function Result() {
    // save files
    const [blob, setBlob] = useState(new Blob());
    const [showDownload, setShowDownload] = useState(true);

    // for master table
    const [tableColumns, setTableColumns] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [showTable, setShowTable] = useState(true);

    // Upset Plot
    const [showUpSet, setShowUpSet] = useState(true);
    const [upsetClasses, setUpsetClasses] = useState([]);

    // histograms
    const [stepHeight, setStepHeight] = useState([]);
    const [showStepHeight, setShowStepHeight] = useState(false);
    const stepHeightCap = 300;
    const [stepFactor, setStepFactor] = useState([]);
    const [showStepFactor, setShowStepFactor] = useState(false);
    const [enrichmentFactor, setEnrichmentFactor] = useState([]);
    const [showEnrichFactor, setShowEnrichFactor] = useState(false);

    // line Chart
    const [showLineChart, setShowLineChart] = useState(false);
    const [linePrimary, setLinePrimary] = useState({});
    const [lineSecondary, setLineSecondary] = useState({});
    const [lineInternal, setLineInternal] = useState({});
    const [lineAntisense, setLineAntisense] = useState({});
    const [lineOrphan, setLineOrphan] = useState({});
    const binSize = 50000;

    /**
    * get all files from TSS prediction as .zip from server
    */
    useEffect(() => {

        /**
        * extract info from mastertable string
        */
        const handleMasterTable = (masterTable) => {

            const allRows = masterTable.split('\n');
            // remove last empty row
            allRows.pop()

            // get column headers
            const headers = (allRows[0]).split('\t');
            // columns for the table
            const col = [];
            headers.forEach((h, i) => {
                const char = i.toString();
                col.push({ Header: h, accessor: char });
            });
            setTableColumns([...col]);

            // save rows
            const dataRows = [];
            allRows.forEach((row, i) => {
                if (i > 0) {
                    const tmp = row.split('\t');
                    var tmpRow = {};
                    tmp.forEach((content, j) => {
                        const char = j.toString()
                        tmpRow[char] = content;
                    });
                    dataRows.push(tmpRow);
                }
            });
            setTableData([...dataRows]);
            if (dataRows.length > 0) {
                stepHeightFactorEnrichementFreq(dataRows, col);
                TSSperPosition(dataRows, col);
            }
        }
       
        // get files from server
        fetch("/result/")
            .then(res => res.blob())
            .then(blob => {

                setBlob(blob);

                JSZip.loadAsync(blob)
                    .then((zip) => {
                        try {
                            zip.file("MasterTable.tsv").async("string").then(data => {
                                handleMasterTable(data);
                            })
                        } catch { console.log('No Master Table file'); }
                    });
            });
    }, []);

    /**
    * download files action, after clicking on link
    */
    const downloadFiles = () => {
        // blob url to download files
        const url = window.URL.createObjectURL(
            new Blob([blob]),
        );
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `TSSpredator-prediction.zip`,
        );
        document.body.appendChild(link);

        // Start download
        link.click();

        // remove link
        link.parentNode.removeChild(link);
    }


    /**
     * calculate frequency for step height, step factor and enrichment factor
     */
    const stepHeightFactorEnrichementFreq = (rows, columns) => {

        // get column indices
        const stepHeightIdx = columns.findIndex((col) => col['Header'] === 'stepHeight');
        const stepFactorIdx = columns.findIndex((col) => col['Header'] === 'stepFactor');
        const enrichFactorIdx = columns.findIndex((col) => col['Header'] === 'enrichmentFactor');

        const stepH = [];
        const stepF = [];
        const enrichmentF = [];

        // count frequncy of stepheight, step factor and enrichment Factor
        rows.forEach((row, i) => {

            if (row[stepHeightIdx] !== 'NA') {
                // cap at 'stepHeightCap' to make histogram readable
                if (row[stepHeightIdx] > stepHeightCap) {
                    stepH.push(stepHeightCap);
                } else {
                    stepH.push(row[stepHeightIdx]);
                }
            }

            if (row[stepFactorIdx] !== 'NA') {
                if ((row[stepFactorIdx]).includes('>')) {
                    stepF.push(100);
                } else {
                    stepF.push(row[stepFactorIdx]);

                }
            }

            if (row[enrichFactorIdx] !== 'NA') {
                if ((row[enrichFactorIdx]).includes('>')) {
                    enrichmentF.push(100);
                } else {
                    enrichmentF.push(row[enrichFactorIdx]);
                }
            }
        });
        setStepHeight(stepH);
        setStepFactor(stepF);
        setEnrichmentFactor(enrichmentF);
    }

    /** 
     * for upset plot: count frequncy of each tss class
     * for line chart: count TSS per position
     */
    const TSSperPosition = (rows, columns) => {

        // get column indices
        const primaryIdx = columns.findIndex((col) => col['Header'] === 'Primary');
        const secondaryIdx = columns.findIndex((col) => col['Header'] === 'Secondary');
        const internalIdx = columns.findIndex((col) => col['Header'] === 'Internal');
        const antisenseIdx = columns.findIndex((col) => col['Header'] === 'Antisense');
        const superPosIdx = columns.findIndex((col) => col['Header'] === 'SuperPos');
        const genomeIdx = columns.findIndex((col) => (col['Header'] === 'Genome' || col['Header'] === 'Condition'));

        // TSS per Position (line chart)
        var primary = { [binSize]: 0 };
        var secondary = { [binSize]: 0 };
        var internal = { [binSize]: 0 };
        var antisense = { [binSize]: 0 };
        var orphan = { [binSize]: 0 };

        // save frequency of classes for a TSS (upset plot)
        var classes = { 'primary': 0, 'secondary': 0, 'internal': 0, 'antisense': 0, 'orphan': 0 };
        var currentPos = "";
        var currentGenome = "";
        var currentClass = {};

        rows.forEach((row, i) => {

            const tmpPos = row[superPosIdx];
            const tmpGenome = row[genomeIdx];
            var tmpClass = getClass(row, primaryIdx, secondaryIdx, internalIdx, antisenseIdx);

            // upset plot --------------------
            // new TSS found -> add classes from previous TSS
            if (tmpPos !== currentPos || tmpGenome !== currentGenome) {
                classes = addNewTSS(currentClass, classes, i);
                // reset value
                currentClass = {};
            }
            // reset values
            currentPos = tmpPos;
            currentGenome = tmpGenome;

            // add class from current row 
            if (tmpClass in currentClass) {
                currentClass[tmpClass] += 1;
            } else {
                currentClass[tmpClass] = 1;
            }

            // ---------------------
            // line chart
            if (tmpClass === 'primary') {
                primary = addTSSPosition(primary, binSize, tmpPos);
            } else if (tmpClass === 'secondary') {
                secondary = addTSSPosition(secondary, binSize, tmpPos);
            } else if (tmpClass === 'internal') {
                internal = addTSSPosition(internal, binSize, tmpPos);
            } else if (tmpClass === 'antisense') {
                antisense = addTSSPosition(antisense, binSize, tmpPos);
            } else {
                orphan = addTSSPosition(orphan, binSize, tmpPos);
            }
            // -----------------------
        });
        // add last tss (upset plot)
        classes = addNewTSS(currentClass, classes);

        setUpsetClasses(classes);
        setLinePrimary(primary);
        setLineSecondary(secondary);
        setLineInternal(internal);
        setLineAntisense(antisense);
        setLineOrphan(orphan);
    }

    /**
     * return tss class of current row
     */
    const getClass = (row, primaryIdx, secondaryIdx, internalIdx, antisenseIdx) => {
        // get class of this row
        if (row[primaryIdx] === '1') {
            return 'primary';
        } else if (row[secondaryIdx] === '1') {
            return 'secondary';
        } else if (row[internalIdx] === '1') {
            return 'internal';
        } else if (row[antisenseIdx] === '1') {
            return 'antisense';
            // orphan
        } else {
            return 'orphan';
        }
    }

    /**
     * upset plot: add last tss to classes object
     */
    const addNewTSS = (currentClass, classes, row) => {
        // at least two different classes
        if (Object.keys(currentClass).length > 1) {

            // sort classes and create new class-group
            const tmpKey = Object.keys(currentClass);
            var node = '';
            tmpKey.sort().forEach(key => {
                node += key + '-';
                // class multiple times
                if (currentClass[key] > 1) {
                    classes[key] += currentClass[key] - 1;
                }
            });
            // remove last '-'
            node = node.slice(0, -1)
            // add class-group to classes
            if (node in classes) {
                classes[node] += 1;
            } else {
                classes[node] = 1;
            }
            // only one class
        } else if (Object.keys(currentClass).length > 0) {
            Object.keys(currentClass).forEach(cl => {
                classes[cl] += currentClass[cl];
            });
        }
        return classes;
    }

    /**
     * line chart: add current TSS possition
     */
    const addTSSPosition = (tssClass, binSize, tmpPos) => {

        const tmpKeys = Object.keys(tssClass);
        var found = false;
        tmpKeys.forEach(k => {
            if (parseInt(tmpPos) <= parseInt(k)) {
                tssClass[k] += 1;
                found = true;
                return;
            }
        });
        if (!found) {
            const arrOfNum = tmpKeys.map(str => { return Number(str); });
            const index = Math.max.apply(Math, arrOfNum) + binSize;
            tssClass[index] = 1;
        }
        return tssClass;
    }


    return (
        <>
            <header>
                <h1>TSSpredator</h1>
            </header>

            <div className='result-container'>

                <div >
                    <h3 className='header click-param' onClick={() => setShowDownload(!showDownload)}>{showDownload ? '-' : '+'} Download result of TSS prediction</h3>
                    <div className={showDownload ? 'download-link' : ' hidden'} onClick={() => downloadFiles()}>TSSpredator-prediction.zip</div>
                </div>

                <div >
                    <h3 className='header click-param' onClick={() => setShowUpSet(!showUpSet)}>{showUpSet ? '-' : '+'} TSS classes overview</h3>
                    {stepHeight.length > 0 ? <UpSet classes={upsetClasses} showUpSet={showUpSet} />
                        : <ClipLoader color='#ffa000' size={30} />}
                </div>

                <div >
                    <h3 className='header click-param' onClick={() => setShowStepHeight(!showStepHeight)}>{showStepHeight ? '-' : '+'} Step Height overview</h3>
                    {stepHeight.length > 0 ? <Histogramm elements={stepHeight} xaxis='Step Height' steps={5} cap={stepHeightCap} show={showStepHeight} />
                        : <ClipLoader color='#ffa000' size={30} />}
                </div>

                <div >
                    <h3 className='header click-param' onClick={() => setShowStepFactor(!showStepFactor)}>{showStepFactor ? '-' : '+'} Step Factor overview</h3>
                    {stepFactor.length > 0 ? <Histogramm elements={stepFactor} xaxis='Step Factor' steps={2} cap='100' show={showStepFactor} />
                        : <ClipLoader color='#ffa000' size={30} />}
                </div>
                <div >
                    <h3 className='header click-param' onClick={() => setShowEnrichFactor(!showEnrichFactor)}>{showEnrichFactor ? '-' : '+'} Enrichment Factor overview</h3>
                    {enrichmentFactor.length > 0 ? <Histogramm elements={enrichmentFactor} xaxis='Enrichment Factor' steps={2} cap='100' show={showEnrichFactor} />
                        : <ClipLoader color='#ffa000' size={30} />}
                </div>

                <div >
                    <h3 className='header click-param' onClick={() => setShowLineChart(!showLineChart)}>{showLineChart ? '-' : '+'} TSS distribution per position in bp</h3>
                    {enrichmentFactor.length > 0 ?
                        <LineChart primary={linePrimary} secondary={lineSecondary} internal={lineInternal} antisense={lineAntisense} orphan={lineOrphan}
                            binSize={binSize} show={showLineChart} />
                        : <ClipLoader color='#ffa000' size={30} />}
                </div>

                <div>
                    <h3 className='header click-param' onClick={() => setShowTable(!showTable)}>{showTable ? '-' : '+'} Master Table</h3>
                    {tableColumns.length > 0 ? <MasterTable tableColumns={tableColumns} tableData={tableData} showTable={showTable}
                    /> : <ClipLoader color='#ffa000' size={30} />}
                </div>

            </div>
        </>
    )
}

export default Result