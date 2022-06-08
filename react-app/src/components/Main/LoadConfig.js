import React from 'react';

function LoadConfig({ header, text, uploadConfig, uploadFiles }) {

    return (
        <div className='error-popup'>
            <div className='error-popup-inner'>
                <h3 className='header error-popup-header'>{header}</h3>
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