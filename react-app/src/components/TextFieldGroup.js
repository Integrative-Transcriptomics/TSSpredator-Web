import React from 'react';
import TextField from './TextField';

/** creates group of text fields
 * 
 * @param fields: Array -> single fields as objects
 * @param id: id of the  Genom/Replicate Tab
 * @param studyType: 'condtion' or 'genome'
 * @param handleTabs: saves input for text fiels
 */
function TextFieldGroup({fields, id, handleTabs, studyType}) {
  return (
    fields.map((field,i) => {
        return <TextField field={field} key={i} id={id} studyType={studyType} handleTabs={(e) => handleTabs(e)}/>
    })
  );
}

export default TextFieldGroup