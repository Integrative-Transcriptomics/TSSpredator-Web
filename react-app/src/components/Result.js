import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import '../css/Result.css';
import '../css/App.css';
import '../css/MasterTable.css';
import MasterTable from './Result/MasterTable';

function Result() {

    const [masterTable, setMasterTable] = useState("");
    const [blob, setBlob] = useState(new Blob());

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
                                setMasterTable(data);
                            });
                        } catch {console.log('No Master Table file');}
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


    return (
        <div>
            <header>
                <h1>TSSpredator</h1>
            </header>

            <div className='result-container'>

                <div >
                    <h3 className='header click-param'> + Download result of TSS prediction</h3>
                    <div className='download-link' onClick={() => downloadFiles()}>result.zip</div>
                </div>

                <div>
                    <h3 className='header click-param'>+ Master Table</h3>
                    {masterTable.length > 0 ? <MasterTable masterTable={masterTable}/> : <></>}
                </div>

            </div>
        </div>
    )
}

export default Result