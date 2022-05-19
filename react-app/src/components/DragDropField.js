import React from 'react';

function DragDropField({ label, state, currentFiles, handleAdd, handleRemove, handleFiles }) {

    const handleDragStart = (event) => {
        event.dataTransfer.setData('name', event.target.dataset.name);
        // state ans setState to remove item out of old drop container
        event.dataTransfer.setData('state', state);
    }

    // dragged item over drop container
    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
    }


    // dragged item dropped into drop container
    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const newFiles = [...event.dataTransfer.files];

        if(newFiles.length === 0 ) {
            handleAdd(event.dataTransfer.getData('name'));

            // remove item from old drop container
            const oldState = event.dataTransfer.getData('state');
            const name = event.dataTransfer.getData('name');
            handleRemove(name, oldState);

        } else {
            const names = [];
            newFiles.forEach(file => {
                handleFiles(file);
                names.push(file.name);
            });
            handleAdd(names);
        }
    }

    return (

        <div className='drag-drop-zone' onDrop={(e) => handleDrop(e)} onDragOver={(e) => handleDragOver(e)} >
            {currentFiles.length === 0 ?  <p>{label}</p> : <></>}

            { typeof currentFiles !== 'undefined' ? 
              currentFiles.map((n,i) => {
                return (
                    <div draggable className='drag-box' key={n} data-name={n} onDragStart={(e) => handleDragStart(e)} id={i}>
                        {n}
                    </div>
                )
            }) : <></>}
        </div>

    )
}

export default DragDropField