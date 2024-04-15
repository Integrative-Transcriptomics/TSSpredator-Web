import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/pro-light-svg-icons';


/**
 * popup window for uploading config file and folder that contains all needed files
 * @param header: header of the popup
 * @param text: text in the popup
 * @param uploadConfig: function for uploading the config file
 * @param uploadConfFiles: function for uploading all files
 */
function LoadConfig({ header, text, uploadConfig, uploadFiles, closePopup }) {

    return (
        <div className='error-popup'>
            <div className='error-popup-inner'>
                <div className='header error-popup-header' style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div />
                    <h3 style={{ textAlign: "center" }}> {header}</h3>
                    <FontAwesomeIcon style={{ "cursor": "pointer", color: "#ffa000", marginRight: "5px" }} onClick={() => {
                        closePopup()
                    }} size="lg" icon={faCircleXmark} />
                </div>
                <div className='error-field'>{text}</div>
                <div className='error-button'>
                    {header === 'Upload Config File'
                        ? <label className='button error'> Upload Config File
                            <input type='file' onChange={(e) => uploadConfig(e)} style={{ display: 'none' }} />
                        </label>

                        : <label className='button error'> Upload Folder
                            <input type='file' onChange={(e) => uploadFiles(e)} style={{ display: 'none' }} directory="" webkitdirectory="" />
                        </label>
                    }

                </div>
            </div>
        </div>
    )
}

export default LoadConfig