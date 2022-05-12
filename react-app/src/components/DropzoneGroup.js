import React, {useState} from 'react';
import Dropzone from './Dropzone';

function DropzoneGroup({dropzones, closePopup, saveFiles}) {

    const [files, setFiles] = useState({'files':{}});

    const updateFiles = (file) => {
        setFiles(current => (
            {...current,
                files: {...current.files,
                        [(file.name).toLowerCase().replace(' ', '')]: file}
            }
        ))
    }

    const save = (event) => {
        saveFiles(event);
        closePopup(event);
    }

    return (
        <div className='popup'>
            <div className='popup-inner'>
                <h3 className='popup-header'>Upload Files</h3>
                {dropzones.map((dropzone,i) => {
                    return <Dropzone dropzone={dropzone} key={i} onChange={(e) => updateFiles(e)}/>
                   
                })}
                <span className="popup-close" onClick={(e) => closePopup(e)}>x</span>
                <button type='button' onClick={(e) => save(files)}>Save Files</button>
            </div>
        </div>
        )

}

export default DropzoneGroup