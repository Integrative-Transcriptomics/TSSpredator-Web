import React, {useState} from 'react';
import Dropzone from './Dropzone';

function DropzoneGroup({dropzones, onChange, saveFiles}) {

    const [files, setFiles] = useState({'files':{}});

    const updateFiles = (file) => {
        setFiles(current => (
            {...current,
                files: {...current.files,
                        [file.name]: file}
            }
        ))
    }

    return (
        <div className='popup'>
            <div className='popup-inner'>
                <h3 className='popup-header'>Upload Files</h3>
                {dropzones.map((dropzone,i) => {
                    return <Dropzone dropzone={dropzone} key={i} onChange={(e) => updateFiles(e)}/>
                   
                })}
                <span className="popup-close" onClick={(e) => onChange(e)}>x</span>
                <button type='button' onClick={(e) => saveFiles(files)}>Save Files</button>
            </div>
        </div>
        )

}

export default DropzoneGroup