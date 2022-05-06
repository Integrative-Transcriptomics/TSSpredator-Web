import React from 'react';
import TextField from './TextField';

function TextFieldGroup({fields, id, onChange}) {
  return (
    fields.map((field,i) => {
        return <TextField field={field} key={i} id={id} onChange={(e) => onChange(e)}/>
    })
  );
}

export default TextFieldGroup