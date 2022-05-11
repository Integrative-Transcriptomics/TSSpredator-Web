import React, {useCallback} from 'react';
import {useDropzone} from 'react-dropzone';

function Dropzone({dropzone, onChange}) {

    const onDrop = useCallback((acceptedFiles) => {
        acceptedFiles.forEach((file) => {
          dropzone.value = file.name;
          const id = dropzone.id;
          onChange({'id':id, 'file':file, 'name':dropzone.name});
        });
    }, []);

    const {getRootProps, getInputProps} = useDropzone({onDrop});
    
    return (
        <div className="dropzone"  {...getRootProps()}>
          <input {...getInputProps()}/>
          <p>{dropzone.value}</p>
        </div>
    )
}
export default Dropzone