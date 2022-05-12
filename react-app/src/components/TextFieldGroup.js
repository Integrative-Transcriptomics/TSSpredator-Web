import React from 'react';
import TextField from './TextField';

/** ersellt Komponente die eine Gruppe an Text Feldern enthält
 * 
 * @param fields: Array -> einzelne Felder als Objekte
 * @param id: id des Genom/Replicate Tabs
 * @param handleTabs: Funktion um Eingaben in Textfeldern des Genom Tabs anzuspeichern
 * @param studyType: 'condtion' oder 'genome'
 */
function TextFieldGroup({fields, id, handleTabs, studyType}) {
  return (
    fields.map((field,i) => {
        return <TextField field={field} key={i} id={id} studyType={studyType} handleTabs={(e) => handleTabs(e)}/>
    })
  );
}

export default TextFieldGroup