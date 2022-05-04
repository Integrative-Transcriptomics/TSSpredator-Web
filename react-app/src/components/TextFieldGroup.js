import React from 'react';
import TextField from './TextField';

function TextFieldGroup({fields}) {
  return (
    fields.map((field,i) => {
        return <TextField field={field} key={i}/>
    })
  );
}

export default TextFieldGroup