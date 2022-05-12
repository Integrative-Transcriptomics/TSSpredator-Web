import React from 'react';
import TextField from './TextField';

function TextFieldGroup({fields, id, handleTabs, studyType}) {
  return (
    fields.map((field,i) => {
        return <TextField field={field} key={i} id={id} studyType={studyType} handleTabs={(e) => handleTabs(e)}/>
    })
  );
}

export default TextFieldGroup