import React, { useState, useEffect } from 'react';
import '../css/Result.css';

function Result() {

    /**
    * download files
    */
    const downloadFiles = () => {
        fetch("/result/")
            .then(response => response.blob())
            .then((blob) => {
                console.log(blob);

                // Create blob link to download
                const url = window.URL.createObjectURL(
                  new Blob([blob]),
                );
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute(
                  'download',
                  `TSSpredator-prediction.zip`,
                );
            
                // Append to html link element page
                document.body.appendChild(link);
            
                // Start download
                link.click();
            
                // Clean up and remove the link
                link.parentNode.removeChild(link);
              });
    }

    return (
        <div>
            <header>
                <h1>TSSpredator</h1>
            </header>

            <div className='download-link' onClick={() => downloadFiles()}>Download result of TSSprediction</div>

        </div>
    )
}

export default Result