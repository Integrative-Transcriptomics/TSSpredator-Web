import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import '../css/Result.css';
import '../css/App.css';

function Result() {

    const [files, setFiles] = useState([]);

    useEffect(() => {

        fetch("/result/")
            .then(res => res.blob())
            .then(blob => {

                JSZip.loadAsync(blob)
                .then((zip) => {
                    zip.forEach((relativePath, zipEntry) => { 
                      files.push(zipEntry);
                      setFiles(files);
                    }); 
                });
            });
        

      }, []);

    /**
    * download files
    */
    const downloadFiles = () => {
        fetch("/result/")
            .then(response => response.blob())
            .then((blob) => {

                const stream = blob.stream();
                
                console.log(files)
            
               

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
            });
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
                </div>

            </div>
        </div>
    )
}

export default Result