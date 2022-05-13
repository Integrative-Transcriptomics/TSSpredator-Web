import React from 'react';
import Dropzone from './Dropzone';

function PopupWindow({ closePopup }) {
    return (
        <div className='popup'>
            <div className='popup-inner'>
                <h3 className='popup-header'>Upload Files - Genome X</h3>

                <div className='popup-columns'>

                    <div className='drop-box-column'>
                        <Dropzone label='Drag n drop your files for Genome X here' />
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        <h4>{'------------->'}</h4>
                        <h5 style={{width: '100px'}}>drag n drop files into the corresponding fields</h5>
                    </div>

                    <div className='drop-box-column'>
                        <h4>Genome Files</h4>
                        <div className='drop-box'>
                            <Dropzone label='Genome FASTA' />
                            <Dropzone label='Genome annotation' />
                        </div>
                    </div>
                    <div className='drop-box-column'>
                        <h4>Replicate A</h4>
                        <div className='drop-box'>
                            <Dropzone label='enriched forward' />
                            <Dropzone label='enriched reverse' />
                            <Dropzone label='normal forward' />
                            <Dropzone label='normal reverse' />
                        </div>
                    </div>
                </div>
                <div className='popup-footer'>
                    <button type='button' onClick={(e) => closePopup(e)}>Cancel</button>
                    <button type='button'>Save</button>
                </div>
            </div>
        </div>
    )
}

export default PopupWindow