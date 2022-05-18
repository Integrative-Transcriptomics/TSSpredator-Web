import React from 'react';

function DragDropField({ label, currentFiles, handleCurrentFiles }) {

    const handleDragStart = (event) => {
        event.dataTransfer.setData('file', event.target.id);
    }

    // dragged item over drop container
    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
    }

    // dragged item leaves container
    const handleDragLeave = (event) => {
        handleCurrentFiles(event.dataTransfer.getData('file'), false);
    }

    // dragged item dropped into drop container
    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();

        if(typeof event.dataTransfer.getData('file') === 'string') {
            handleCurrentFiles(event.dataTransfer.getData('file'), true);
        }
    }

    return (

        <div className='drag-drop-zone' onDrop={(e) => handleDrop(e)} onDragOver={(e) => handleDragOver(e)} onDragLeave={(e) => handleDragLeave(e)}>
            <p>{label}</p>

            { typeof currentFiles !== 'undefined' ? 
              currentFiles.map(n => {
                return (
                    <div draggable className='drag-box' key={n} onDragStart={(e) => handleDragStart(e)} id={n}>
                        {n}
                    </div>
                )
            }) : <></>}
        </div>

    )
}

export default DragDropField