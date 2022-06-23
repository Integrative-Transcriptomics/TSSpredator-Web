import React, { useState, useEffect } from 'react';
import ClipLoader from "react-spinners/ClipLoader";
import JSZip from 'jszip';
import '../css/Result.css';
import '../css/App.css';
import '../css/MasterTable.css';
import MasterTable from './Result/MasterTable';
import UpSet from './Result/UpSet';
import Histogramm from './Result/Histogramm';

/**
 * create page that displays result of TSS prediction 
 */

function Result() {
    // save files
    const [blob, setBlob] = useState(new Blob());
    const [showDownload, setShowDownload] = useState(true);

    // for master table
    const [tableColumns, setTableColumns] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [showTable, setShowTable] = useState(true);
    const [showUpSet, setShowUpSet] = useState(true);

    // histograms
    const [stepHeight, setStepHeight] = useState([]);
    const [showStepHeight, setShowStepHeight] = useState(false);
    const stepHeightCap = 300;
    const [stepFactor, setStepFactor] = useState([]);
    const [showStepFactor, setShowStepFactor] = useState(false);
    const [enrichmentFactor, setEnrichmentFactor] = useState([]);
    const [showEnrichFactor, setShowEnrichFactor] = useState(false);

    /**
    * get all files from TSS prediction as .zip from server
    */
    useEffect(() => {
        fetch("/result/")
            .then(res => res.blob())
            .then(blob => {

                setBlob(blob);

                JSZip.loadAsync(blob)
                    .then((zip) => {
                        try {
                            zip.file("MasterTable.tsv").async("string").then(data => {
                                handleMasterTable(data);
                            });
                        } catch { console.log('No Master Table file'); }
                    });
            });
    }, []);

    /**
    * download files
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
     * extract info from mastertable string
     */
    const handleMasterTable = (masterTable) => {

        const allRows = masterTable.split('\n');
        // remove last empty row
        allRows.pop()

        // column headers
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

        stepHeightFactorEnrichementFreq(dataRows, col);
    }

    /**
     * calculate frequency for step height, step factor and enrichment factor
     */
    const stepHeightFactorEnrichementFreq = (rows, columns) => {

        const stepHeightIdx = columns.findIndex((col) => col['Header'] === 'stepHeight');
        const stepFactorIdx = columns.findIndex((col) => col['Header'] === 'stepFactor');
        const enrichFactorIdx = columns.findIndex((col) => col['Header'] === 'enrichmentFactor');

        const stepH = [];
        const stepF = [];
        const enrichmentF = [];

        // count frequncy of stepheight, step factor and enrichment Factor
        rows.forEach((row, i) => {
           
            const tmpIdx =i.toString();

            if(row[stepHeightIdx] !== 'NA') {
                // cap at 500 to make histogram readable
                if(row[stepHeightIdx] > stepHeightCap) {
                    stepH.push(stepHeightCap);
                } else {
                    const tmpSH = Math.round(row[stepHeightIdx]);
                    stepH.push(tmpSH);
                }
            }

            if(row[stepFactorIdx] !== 'NA') {
                if((row[stepFactorIdx]).includes('>')) {
                    stepF.push(100);
                } else {
                    const tmpSF = Math.round(row[stepFactorIdx]);
                    stepF.push(tmpSF);
                    
                }
            } 

            if(row[enrichFactorIdx] !== 'NA') {
                if((row[enrichFactorIdx]).includes('>')) {
                    enrichmentF.push(100);
                } else {
                    const tmpEF = Math.round(row[enrichFactorIdx]);
                    enrichmentF.push(tmpEF);
                }
            }
        });
        setStepHeight(stepH);
        setStepFactor(stepF);
        setEnrichmentFactor(enrichmentF);
    }


    return (
        <>
            <header>
                <h1>TSSpredator</h1>
            </header>

            <div className='result-container'>

                <div >
                    <h3 className='header click-param' onClick={() => setShowDownload(!showDownload)}> + Download result of TSS prediction</h3>
                    <div className={showDownload ? 'download-link' : ' hidden'} onClick={() => downloadFiles()}>TSSpredator-prediction.zip</div>
                </div>

                <div >
                    <h3 className='header click-param' onClick={() => setShowUpSet(!showUpSet)}> + TSS classes overview</h3>
                    {tableColumns.length > 0 ? <UpSet rows={tableData} columns={tableColumns} showUpSet={showUpSet} />
                        : <ClipLoader color='#ffa000' size={30} />}
                </div>

                <div >
                    <h3 className='header click-param' onClick={() => setShowStepHeight(!showStepHeight)}> + Step Height overview</h3>
                    {stepHeight.length > 0 ? <Histogramm elements={stepHeight} xaxis='Step Height' steps={5} cap={stepHeightCap} show={showStepHeight}/>
                        : <ClipLoader color='#ffa000' size={30} />}
                </div>

                <div >
                    <h3 className='header click-param' onClick={() => setShowStepFactor(!showStepFactor)}> + Step Factor overview</h3>
                    {stepFactor.length > 0 ? <Histogramm elements={stepFactor} xaxis='Step Factor' steps={2} cap='100' show={showStepFactor}/>
                        : <ClipLoader color='#ffa000' size={30} />}
                </div>
                <div >
                    <h3 className='header click-param' onClick={() => setShowEnrichFactor(!showEnrichFactor)}> + Enrichment Factor overview</h3>
                    {enrichmentFactor.length > 0 ? <Histogramm elements={enrichmentFactor} xaxis='Enrichment Factor' steps={2} cap='100' show={showEnrichFactor}/>
                        : <ClipLoader color='#ffa000' size={30} />}
                </div>

                <div>
                    <h3 className='header click-param' onClick={() => setShowTable(!showTable)}>+ Master Table</h3>
                    {tableColumns.length > 0 ? <MasterTable tableColumns={tableColumns} tableData={tableData} showTable={showTable}
                    /> : <ClipLoader color='#ffa000' size={30} />}
                </div>

            </div>
        </>
    )
}

export default Result