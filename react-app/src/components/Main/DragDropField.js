import React from 'react';

/**
 * creates a drop container
 * @param label: description of the container
 * @param state: the state of the container -> in which the items in the container are stored
 * @param currentFiles: the items that are currently in the container
 * @param handleAdd: adds a item to the current container
 * @param handleRemove: removes the item from the old container, after it was dropped into the current one
 * @param handleFiles: saves all uploaded files
 * @param index: for all containers for replicate files -> index = which replicate, starting by 0
 * @param disabled: should field be disabled
 */

function DragDropField({ label, state, currentFiles, handleAdd, handleRemove, handleFiles, index, disabled, tooltip }) {

    const handleDragStart = (event) => {
        event.dataTransfer.setData('name', event.target.dataset.name);
        // set state to remove item out of old drop container
        event.dataTransfer.setData('state', state);
        // for the replicates
        if (typeof index !== 'undefined') {
            event.dataTransfer.setData('index', index);
        }
    }

    // dragged item over drop container
    const handleDragOver = (event) => {
        // only one file per field, exeption: upload box 
        if (!disabled) {
            if (state === 'upload' || currentFiles.length === 0 || typeof currentFiles[0] === 'undefined') {
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }

    // dragged item dropped into drop container
    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const newFiles = [...event.dataTransfer.files];

        // no new file uploaded, just a item moved from a different container
        if (newFiles.length === 0) {
            handleAdd(event.dataTransfer.getData('name'));

            // remove item from old drop container
            const oldState = event.dataTransfer.getData('state');
            const name = event.dataTransfer.getData('name');
            const index = event.dataTransfer.getData('index');

            if (index.length > 0) {
                handleRemove(name, oldState, parseInt(index));
            } else {
                handleRemove(name, oldState);
            }
        // new files uploaded    
        } else {
            const names = [];
            newFiles.forEach(file => {
                names.push(file.name);
            });
            handleFiles(newFiles);
            handleAdd(names);
        }
    }

    let className = 'drag-drop-zone';
    if (state === 'upload') {
        className += ' scroll';
    }

    return (
        <div className={disabled ? className + ' disabled-zone' : className} onDrop={(e) => handleDrop(e)} onDragOver={(e) => handleDragOver(e)} data-tooltip={tooltip}>
            {currentFiles.length === 0 || typeof currentFiles[0] === 'undefined' ? <p>{label}</p> : <></>}

            {typeof currentFiles !== 'undefined' ?
                currentFiles.map((n, i) => {
                    return (
                        <div draggable className={typeof n === 'undefined' ? ' ' : 'drag-box'} key={n + i} data-name={n} onDragStart={(e) => handleDragStart(e)} id={i}>
                            {n}
                        </div>
                    )
                }) : <></>}
        </div>
    )
}

export default DragDropField