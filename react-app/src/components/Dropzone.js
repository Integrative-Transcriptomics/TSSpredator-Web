import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Draggable from 'react-draggable';

function Dropzone({label}) {

  const [items, setItems] = useState([]);

  const onDrop = useCallback(acceptedFiles => {
    acceptedFiles.forEach((file) => {
      setItems(current => (
        [...current, file]
      ))
    });

  }, [])
  const { getRootProps, getInputProps } = useDropzone({ onDrop, noClick: true })

  console.log(items)

  return (
    <div className='dropzone'{...getRootProps()}>
      <input {...getInputProps()} />
      <p className='drag-text'>{items.length > 0 ? <></>:label }</p>
      {items.map((item, i) => {
        return (
          <Draggable >
            <div className='drag-box'>
              <div style={{whiteSpace: "nowrap"}}>{typeof item === 'undefined' ? <></> : item.path}</div>
            </div>
          </Draggable>
        )
      })}

    </div>

  )
}
export default Dropzone