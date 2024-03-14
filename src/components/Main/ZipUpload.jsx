import React from 'react';

/**
 * popup window for uploading config file and folder that contains all needed files
 * @param header: header of the popup
 * @param text: text in the popup
 * @param uploadConfig: function for uploading the config file
 * @param uploadConfFiles: function for uploading all files
 */
function ZipUpload({ }) {
    const startZipUpload = (e) => {
        const file = e.target.files[0];
        console.log(file)
    }

    return (
        <div className='error-popup'>
            <div className='error-popup-inner'>
                <h3 className='header error-popup-header'>Upload Zip File</h3>
                <div className='error-field'>Please Upload a Zip File generated with TSSPredator-Web</div>
                <div className='error-button'>

                    <label className='button error'> Upload Zip File
                        <input type='file' onChange={(e) => startZipUpload(e)} style={{ display: 'none' }} />
                    </label>




                </div>
            </div>
        </div>
    )
}

export default ZipUpload