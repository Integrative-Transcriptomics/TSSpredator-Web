import React, { useState } from 'react';
import DragDropField from './DragDropField';

function PopupWindow({ closePopup }) {

    // saves all uploaded files
    const [allFiles, setAllFiles] = useState([]);

    // save file names to drag and drop
    const [upload, setUpload] = useState([]);
    const [genomeFasta, setGenomeFasta] = useState([]);
    const [genomeAnn, setGenomeAnn] = useState([]);
    const [enrichF, setEnrichF] = useState([]);
    const [enrichR, setEnrichR] = useState([]);
    const [normalF, setNormalF] = useState([]);
    const [normalR, setNormalR] = useState([]);

    // save all uploaded Files
    const handleFiles = (event) => {
        setAllFiles([...allFiles, event]);
    }
    // add item to drop container
    const handleAdd = (event, state, set) => {
        // for upload container -> drop several files at the same time
        if(Array.isArray(event)) {
            set([...state, ...event]);  
        } else {
            set([...state, event]);
        }   
    }
    // remove item from drop ciontainer
    const handleRemove = (event, oldState) => {
        if (oldState.length > 0) {
            let set;
            let state;
            switch (oldState) {
                case 'genomeFasta':
                    state = genomeFasta;
                    set = setGenomeFasta;
                    break;
                case 'genomeAnn':
                    state = genomeAnn;
                    set = setGenomeAnn;
                    break;
                case 'enrichF':
                    state = enrichF;
                    set = setEnrichF;
                    break;
                case 'enrichR':
                    state = enrichR;
                    set = setEnrichR;
                    break;
                case 'normalF':
                    state = normalF;
                    set = setNormalF;
                    break;
                case 'normalR':
                    state = normalR;
                    set = setNormalR;
                    break;
                case 'upload':
                    state = upload;
                    set = setUpload;
                    break;
            }
            const temp = state.filter(name => name !== event);
            set([...temp]);
        }
    }


    return (
        <div className='popup'>
            <div className='popup-inner'>
                <h3 className='popup-header'>Upload Files - Genome X</h3>

                <div className='popup-columns'>

                    <div className='drop-box-column'>
                        <DragDropField label='Drop your file for Genome X here and drag them into the corresponding field' currentFiles={upload} state='upload'
                                        handleAdd={(e) => handleAdd(e, upload, setUpload)} handleRemove={(e, s) => handleRemove(e, s)} handleFiles={(e) => handleFiles(e)}/>

                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h4>{'------------->'}</h4>
                    </div>

                    <div className='drop-box-column'>
                        <h4>Genome Files</h4>
                        <div className='drop-box'>
                            <DragDropField label='Genome FASTA' currentFiles={genomeFasta} state='genomeFasta'
                                handleAdd={(e) => handleAdd(e, genomeFasta, setGenomeFasta)} handleRemove={(e, s) => handleRemove(e, s)} handleFiles={(e) => handleFiles(e)}/>
                            <DragDropField label='Genome Annotation' currentFiles={genomeAnn} state='genomeAnn'
                                handleAdd={(e) => handleAdd(e, genomeAnn, setGenomeAnn)} handleRemove={(e, s) => handleRemove(e, s)} handleFiles={(e) => handleFiles(e)}/>
                        </div>
                    </div>
                    <div className='drop-box-column'>
                        <div className='element-row'>
                            <div className="arrows prev" onClick={(e) => console.log('click')}></div>
                            <h4> Replicate A </h4>
                            <div className="arrows next" onClick={(e) => console.log('click')}></div>
                        </div>


                        <div className='drop-box'>
                            <DragDropField label='enriched forward' currentFiles={enrichF} state='enrichF'
                                handleAdd={(e) => handleAdd(e, enrichF, setEnrichF)} handleRemove={(e, s) => handleRemove(e, s)} handleFiles={(e) => handleFiles(e)}/>
                            <DragDropField label='enriched reverse' currentFiles={enrichR} state='enrichR' s
                                handleAdd={(e) => handleAdd(e, enrichR, setEnrichR)} handleRemove={(e, s) => handleRemove(e, s)} handleFiles={(e) => handleFiles(e)} />
                            <DragDropField label='normal forward' currentFiles={normalF} state='normalF'
                                handleAdd={(e) => handleAdd(e, normalF, setNormalF)} handleRemove={(e, s) => handleRemove(e, s)} handleFiles={(e) => handleFiles(e)}/>
                            <DragDropField label='normal reverse' currentFiles={normalR} state='normalR'
                                handleAdd={(e) => handleAdd(e, normalR, setNormalR)} handleRemove={(e, s) => handleRemove(e, s)} handleFiles={(e) => handleFiles(e)}/>

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