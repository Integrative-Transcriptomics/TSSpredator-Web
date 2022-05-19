import React, { useState } from 'react';
import DragDropField from './DragDropField';

/**
 * replicate column in the popup window
 * use arrows to flip through different replicates
 */
function ReplicateColumn({ handleRemove, handleFiles, handleAddEF, handleAddER, handleAddNF, handleAddNR, currentEF, currentER, currentNF, currentNR }) {

    // show correct replicate column
    const [state, setState] = useState(0);
    const numRep = 3;

    const flipLeft = (index) => {
        const idx = index - 1;
        if (idx < 0) {
            setState(numRep - 1);
        } else {
            setState(idx);
        }
    }

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
                    <div className={state === i ? 'drop-box-column column-active' : 'drop-box-column'} key={i}>
                        <div className='element-row'>
                            <div className="arrows prev" onClick={() => flipLeft(i)}></div>
                            <h4> Replicate {String.fromCharCode(97 + i)} </h4>
                            <div className="arrows next" onClick={() => flipRight(i)}></div>
                        </div>
                        <div className={state === i ? 'drop-box' : 'drop-box-rep'} >
                            <DragDropField label='enriched forward' currentFiles={currentEF} state='enrichF'
                                handleAdd={(e) => handleAddEF(e)} handleRemove={(e, s) => handleRemove(e, s)} handleFiles={(e) => handleFiles(e)} />

                            <DragDropField label='enriched reverse' currentFiles={currentER} state='enrichR' s
                                handleAdd={(e) => handleAddER(e)} handleRemove={(e, s) => handleRemove(e, s)} handleFiles={(e) => handleFiles(e)} />

                            <DragDropField label='normal forward' currentFiles={currentNF} state='normalF'
                                handleAdd={(e) => handleAddNF(e)} handleRemove={(e, s) => handleRemove(e, s)} handleFiles={(e) => handleFiles(e)} />

                            <DragDropField label='normal reverse' currentFiles={currentNR} state='normalR'
                                handleAdd={(e) => handleAddNR(e)} handleRemove={(e, s) => handleRemove(e, s)} handleFiles={(e) => handleFiles(e)} />

                        </div>
                    </div>
                )
            })}

        </div>

    )


}

export default ReplicateColumn