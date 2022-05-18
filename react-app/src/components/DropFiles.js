import React, { useState } from 'react';

/**
 * upload files 
 */
function DropFiles({ handleFiles }) {

    const [names, setNames] = useState([])

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
        const temp = names.filter(name => name != event.dataTransfer.getData('file') )
        setNames(temp)
    }

    // dragged item dropped into drop container
    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const newFiles = [...event.dataTransfer.files];

        newFiles.forEach(file => {
            handleFiles(file);
            names.push(file.name)
        });
    }

    return (

        <div className='drag-drop-zone' onDrop={(e) => handleDrop(e)} onDragOver={(e) => handleDragOver(e)} onDragLeave={(e) => handleDragLeave(e)}>
            <p>Drop your file for Genome X here</p>

            {typeof names === 'undefined' ? <></> :
                names.map(name => {
                    return (
                        <div draggable className='drag-box' key={name} onDragStart={(e) => handleDragStart(e)} id={name}>
                            {name}
                        </div>
                    )
                })}
        </div>

    )
}

export default DropFiles