import React, { useState } from 'react';
import DragDropField from './DragDropField';

/**
 * replicate column in the popup window, use arrows to flip through different replicates
 * 
 * @param handleRemove: removes item from drop container after it was moved into a new container
 * @param handleFiles: saves all uploaded files
 * @param handleAddEF: adds a draggable item to a enriched forward container
 * @param handleAddER: adds a draggable item to a enriched reverse container
 * @param handleAddNF: adds a draggable item to a normal forward container
 * @param handleAddNR: adds a draggable item to a normal reverse container
 * @param currentEF: items that currently are in a enriched forward container
 * @param currentER: items that currently are in a enriched reverse container
 * @param currentNF: items that currently are in a normal forward container
 * @param currentNR: items that currently are in a normal reverse container
 * @param numRep: number of replicates
 */
function ReplicateColumn({ handleRemove, handleFiles, handleAddEF, handleAddER, handleAddNF, handleAddNR, currentEF, currentER, currentNF, currentNR, numRep }) {

    // show correct replicate column
    const [state, setState] = useState(0);

    // action for left arrow
    const flipLeft = (index) => {
        const idx = index - 1;
        if (idx < 0) {
            setState(numRep - 1);
        } else {
            setState(idx);
        }
    }

    // action for right arrow
    const flipRight = (index) => {
        const idx = index + 1;
        if (idx > numRep - 1) {
            setState(0);
        } else {
            setState(idx);
        }
    }

    return (
        <div className='replicate-container'>
            {[...Array(numRep)].map((g, i) => {
                return (
                    <div className={state === i ? 'replicate-column column-active' : 'replicate-column'} key={i}>
                        <div className='row'>
                            { numRep > 1 ? <div className="arrows prev" onClick={() => flipLeft(i)}></div> : <></>}
                            <h4> Replicate {String.fromCharCode(97 + i)} </h4>
                            { numRep > 1 ? <div className="arrows next" onClick={() => flipRight(i)}></div> : <></>}
                            
                        </div>
                        <div className={state === i ? 'drop-box' : 'drop-box drop-box-rep'} >
                            <DragDropField label='enriched forward file' currentFiles={[currentEF[i]]} state='enrichF' index={i}
                                handleAdd={(e) => handleAddEF(e, i)} handleRemove={(e, s, idx) => handleRemove(e, s, idx)} handleFiles={(e) => handleFiles(e)}
                                tooltip="Graph file containing the RNA-seq expression graph for the forward strand from the 5' enrichment library. tagRNA-seq: Use the TSS reads here." />

                            <DragDropField label='enriched reverse file' currentFiles={[currentER[i]]} state='enrichR' index={i}
                                handleAdd={(e) => handleAddER(e, i)} handleRemove={(e, s, i) => handleRemove(e, s, i)} handleFiles={(e) => handleFiles(e)} 
                                tooltip="Graph file containing the RNA-seq expression graph for the reverse strand from the 5' enrichment library. tagRNA-seq: Use the TSS reads here."/>

                            <DragDropField label='normal forward file' currentFiles={[currentNF[i]]} state='normalF' index={i}
                                handleAdd={(e) => handleAddNF(e, i)} handleRemove={(e, s, i) => handleRemove(e, s, i)} handleFiles={(e) => handleFiles(e)}
                                tooltip="Graph file containing the RNA-seq expression graph for the forward strand from library without 5' enrichment. tagRNA-seq: Use the PSS reads here." />

                            <DragDropField label='normal reverse file' currentFiles={[currentNR[i]]} state='normalR' index={i}
                                handleAdd={(e) => handleAddNR(e, i)} handleRemove={(e, s, i) => handleRemove(e, s, i)} handleFiles={(e) => handleFiles(e)} 
                                tooltip="Graph file containing the RNA-seq expression graph for the reverse strand from library without 5' enrichment. tagRNA-seq: Use the PSS reads here."/>

                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default ReplicateColumn