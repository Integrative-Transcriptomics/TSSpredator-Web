import React, { useState } from 'react';
import DragDropField from './DragDropField';
import ReplicateColumn from './ReplicateColumn';

/**
 * popup window for file upload -> button: upload files together
 * @param closePopup: boolean for opening and closing the popup
 * @param numRep: number of replicates
 * @param saveAllFiles: function to save files in the corresponding usestate in App.js
 * @param gIdx: current genome tab
 * @param disabled: studytype condition
 */
function PopupWindow({ closePopup, numRep, saveAllFiles, gIdx, disabled }) {

    // saves all uploaded files
    const [allFiles, setAllFiles] = useState([]);

    // save file names to drag and drop
    const [upload, setUpload] = useState([]);
    const [genomeFasta, setGenomeFasta] = useState([]);
    const [genomeAnn, setGenomeAnn] = useState([]);
    // each index in the objects stands for one replicate
    const [enrichF, setEnrichF] = useState({});
    const [enrichR, setEnrichR] = useState({});
    const [normalF, setNormalF] = useState({});
    const [normalR, setNormalR] = useState({});

    // save all uploaded Files
    const handleNewFiles = (event) => {
        // check if file is already uploaded
        event.forEach((file, i) => {
            if (upload.includes(file.name)) {
                event.splice(i, 1);
            }
        })
        setAllFiles([...allFiles, ...event]);
    }
    // add item to drop container
    const handleAdd = (event, state, set, index) => {

        // for all non-replicate files
        if (typeof index === 'undefined') {

            // for upload container -> drop several files at the same time
            if (Array.isArray(event)) {
                set([...state, ...event]);
            } else {
                set([...state, event]);
            }
            // for replicate-files
        } else {
            // when file is dropped directly in container
            if (Array.isArray(event)) {
                set(current => ({
                    ...current, [index]: event[0]
                }))
            } else {
                set(current => ({
                    ...current, [index]: event
                }))
            }

        }
    }
    // remove item from drop container
    const handleRemove = (event, oldState, index) => {

        switch (oldState) {
            case 'upload':
                setUpload([...upload.filter(name => name !== event)]);
                break;
            case 'genomeFasta':
                setGenomeFasta([...genomeFasta.filter(name => name !== event)]);
                break;
            case 'genomeAnn':
                setGenomeAnn([...genomeAnn.filter(name => name !== event)]);
                break;
            case 'enrichF':
                delete enrichF[index];
                break;
            case 'enrichR':
                delete enrichR[index];
                break;
            case 'normalF':
                delete normalF[index];
                break;
            case 'normalR':
                delete normalR[index];
                break;
            default: break;
        }
    }

    const saveFiles = (event) => {

        let genomeFiles = { 'genomefasta': '', 'genomeannotation': [] };
        let genomeFastaFound = false;

        let enrichedForwardFiles = { '0': '' };
        let numEF = 0;

        let enrichedReverseFiles = { '0': '' };
        let numER = 0;

        let normalForwardFiles = { '0': '' };
        let numNF = 0;

        let normalReverseFiles = { '0': '' };
        let numNR = 0;

        allFiles.forEach((file) => {
            if (genomeFasta.includes(file.name) && !genomeFastaFound) {
                genomeFiles.genomefasta = file;
                genomeFastaFound = true;
                return;
            } else if (genomeAnn.includes(file.name)) {
                genomeFiles.genomeannotation.push(file);
                return;
            } else {
                if (numEF <= numRep) {
                    Object.keys(enrichF).forEach((key) => {
                        if (enrichF[key] === file.name) {
                            enrichedForwardFiles[parseInt(key)] = file;
                            numEF++;
                            return;
                        }
                    });
                }
                if (numER <= numRep) {
                    Object.keys(enrichR).forEach((key) => {
                        if (enrichR[key] === file.name) {
                            enrichedReverseFiles[parseInt(key)] = file;
                            numER++;
                            return;
                        }
                    });
                }
                if (numNF < numRep) {
                    Object.keys(normalF).forEach((key) => {
                        if (normalF[key] === file.name) {
                            normalForwardFiles[parseInt(key)] = file;
                            numNF++;
                            return;
                        }
                    });
                }
                if (numNR <= numRep) {
                    Object.keys(normalR).forEach((key) => {
                        if (normalR[key] === file.name) {
                            normalReverseFiles[parseInt(key)] = file;
                            numNR++;
                            return;
                        }
                    });
                }
            }
        })
        saveAllFiles(genomeFiles, enrichedForwardFiles, enrichedReverseFiles, normalForwardFiles, normalReverseFiles);
        closePopup(event);
    }


    return (
        <div className='popup'>
            <div className='popup-inner'>
                <h3 className='header popup-header'>Upload Files - Genome {gIdx}</h3>

                <div className='popup-columns'>

                    <div className='drop-box-column column-active'>
                        <DragDropField label={'Drop your files for Genome ' + gIdx + ' here and drag them into the corresponding field'} currentFiles={upload} state='upload'
                            handleAdd={(e) => handleAdd(e, upload, setUpload)} handleRemove={(e, s, i) => handleRemove(e, s, i)} handleFiles={(e) => handleNewFiles(e)} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="long-arrow">
                            <div className="arrow-line"></div>
                            <div className="arrow-point"></div>
                        </div>
                    </div>

                    <div className='drop-box-column column-active'>
                        <h4>Genome Files</h4>
                        <div className='drop-box'>
                            <DragDropField label={disabled ? 'no file needed' : 'Genome FASTA file'} currentFiles={genomeFasta} state='genomeFasta' disabled={disabled}
                                handleAdd={(e) => handleAdd(e, genomeFasta, setGenomeFasta)} handleRemove={(e, s, i) => handleRemove(e, s, i)} handleFiles={(e) => handleNewFiles(e)} />
                            <DragDropField label={disabled ? 'no file needed' : 'Genome Annotation file(s)'} currentFiles={genomeAnn} state='genomeAnn' disabled={disabled}
                                handleAdd={(e) => handleAdd(e, genomeAnn, setGenomeAnn)} handleRemove={(e, s, i) => handleRemove(e, s, i)} handleFiles={(e) => handleNewFiles(e)} />
                        </div>
                    </div>

                    <ReplicateColumn handleRemove={(e, s, i) => handleRemove(e, s, i)} handleFiles={(e) => handleNewFiles(e)} numRep={numRep}
                        handleAddEF={(e, i) => handleAdd(e, enrichF, setEnrichF, i)} currentEF={enrichF}
                        handleAddER={(e, i) => handleAdd(e, enrichR, setEnrichR, i)} currentER={enrichR}
                        handleAddNF={(e, i) => handleAdd(e, normalF, setNormalF, i)} currentNF={normalF}
                        handleAddNR={(e, i) => handleAdd(e, normalR, setNormalR, i)} currentNR={normalR} />

                </div>
                <div className='popup-footer'>
                    <button className='button' type='button' onClick={(e) => closePopup(e)}>Cancel</button>
                    <button className='button' type='button' onClick={(e) => saveFiles(e)}>Save</button>
                </div>
            </div>
        </div>
    )
}

export default PopupWindow