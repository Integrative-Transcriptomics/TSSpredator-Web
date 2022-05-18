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

    const handleGenomeFasta = (event,add) => {
        if(add){
            setGenomeFasta([...genomeFasta, event]);
        } else {
            const temp = genomeFasta.filter(name => name !== event);
            setGenomeFasta([...temp]);
        }
    }
    const handleGenomeAnn = (event,add) => {
        if(add) {
            setGenomeAnn([...genomeAnn, event]);
        } else {
            const temp = genomeAnn.filter(name => name !== event);
            setGenomeAnn([...temp]);
        }
    }
    const handleEnrichF = (event,add) => {
        if(add) {
            setEnrichF([...enrichF, event]);
        } else {
            const temp = enrichF.filter(name => name !== event);
            setEnrichF([...temp]);
        }
    }
    const handleEnrichR = (event,add) => {
        if(add) {
            setEnrichR([...enrichR, event]);
        } else {
            const temp = enrichR.filter(name => name !== event);
            setEnrichR([...temp]);
        }
    }
    const handleNormalF = (event,add) => {
        if(add) {
            setNormalF([...normalF, event]);
        } else {
            const temp = normalF.filter(name => name !== event);
            setNormalF([...temp]);
        }
    }
    const handleNormalR = (event,add) => {
        if(add) {
            setNormalR([...normalR, event]);
        } else {
            const temp = normalR.filter(name => name !== event);
            setNormalR([...temp]);
        }
    }
   

    return (
        <div className='popup'>
            <div className='popup-inner'>
                <h3 className='popup-header'>Upload Files - Genome X</h3>

                <div className='popup-columns'>

                    <div className='drop-box-column'>
                       <DropFiles  handleFiles={(e) => handleFiles(e)}/>

                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h4>{'------------->'}</h4>
                        <h5 style={{ width: '100px' }}>drag n drop files into the corresponding fields</h5>
                    </div>

                    <div className='drop-box-column'>
                        <h4>Genome Files</h4>
                        <div className='drop-box'>
                            <DragDropField label='Genome FASTA' currentFiles={genomeFasta} handleCurrentFiles={(e,a) => handleGenomeFasta(e,a)}/>
                            <DragDropField label='Genome Annotation' currentFiles={genomeAnn} handleCurrentFiles={(e,a) => handleGenomeAnn(e,a)} />
                        </div>
                    </div>
                    <div className='drop-box-column'>
                        <h4>Replicate A</h4>
                        <div className='drop-box'>
                            <DragDropField label='enriched forward' currentFiles={enrichF} handleCurrentFiles={(e,a) => handleEnrichF(e,a)} />
                            <DragDropField label='enriched reverse' currentFiles={enrichR} handleCurrentFiles={(e,a) => handleEnrichR(e,a)} />
                            <DragDropField label='normal forward' currentFiles={normalF} handleCurrentFiles={(e,a) => handleNormalF(e,a)} />
                            <DragDropField label='normal reverse' currentFiles={normalR} handleCurrentFiles={(e,a) => handleNormalR(e,a)}/>

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