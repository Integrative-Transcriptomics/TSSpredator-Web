import React from 'react';
import TextField from './TextField';

function TextFieldGroup({fields}) {
  return (
    fields.map(field => {
        return <TextField field={field}/>
    })
  );
}

export default TextFieldGroup