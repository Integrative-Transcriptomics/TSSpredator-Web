import React, { useState } from 'react';
import DragDropField from './DragDropField';
import DropFiles from './DropFiles';


function PopupWindow({ closePopup }) {

    // saves all uploaded files
    const [allFiles, setAllFiles] = useState([]);

    // save file names to drag and drop
    const [genomeFasta, setGenomeFasta] = useState([]);
    const [genomeAnn, setGenomeAnn] = useState([]);
    const [enrichF, setEnrichF] = useState([]);
    const [enrichR, setEnrichR] = useState([]);
    const [normalF, setNormalF] = useState([]);
    const [normalR, setNormalR] = useState([]);

    const handleFiles = (event) => {
        setAllFiles([...allFiles, event]);
    }

    const handle = (event, add, state, set) => {
        if (add) {
            set([...state, event]);
        } else {
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
                        <DropFiles handleFiles={(e) => handleFiles(e)} />

                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h4>{'------------->'}</h4>
                    </div>

                    <div className='drop-box-column'>
                        <h4>Genome Files</h4>
                        <div className='drop-box'>
                            <DragDropField label='Genome FASTA' currentFiles={genomeFasta} handleCurrentFiles={(e, a) => handle(e, a, genomeFasta, setGenomeFasta)} />
                            <DragDropField label='Genome Annotation' currentFiles={genomeAnn} handleCurrentFiles={(e, a) => handle(e, a, genomeAnn, setGenomeAnn)} />
                        </div>
                    </div>
                    <div className='drop-box-column'>
                        <div className='element-row'>
                            <div className="arrows prev" onClick={(e) => console.log('click')}></div>
                            <h4> Replicate A </h4>
                            <div className="arrows next" onClick={(e) => console.log('click')}></div>
                        </div>


                        <div className='drop-box'>
                            <DragDropField label='enriched forward' currentFiles={enrichF} handleCurrentFiles={(e, a) => handle(e, a, enrichF, setEnrichF)} />
                            <DragDropField label='enriched reverse' currentFiles={enrichR} handleCurrentFiles={(e, a) => handle(e, a, enrichR, setEnrichR)} />
                            <DragDropField label='normal forward' currentFiles={normalF} handleCurrentFiles={(e, a) => handle(e, a, normalF, setNormalF)} />
                            <DragDropField label='normal reverse' currentFiles={normalR} handleCurrentFiles={(e, a) => handle(e, a, normalR, setNormalR)} />

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