import React from 'react';

/** creates text field with label
 * 
 * @param field: field saved as object
 * @param id: id of the Genom/Replicate Tab
 * @param studyType: 'condtion' or 'genome'
 * @param handleTabs: saves input for text fiels
 */
function TextField({ field, id, studyType, handleTabs }) {

  let disabled = false;
  let value = "";
  let title;

  if(field.name === 'Alignment ID') {
    title = "The identifier of this genome in the alignment file. If Mauve was used to align the genomes, the identifiers are just numbers assigned to the genomes in the order as they have been chosen as input in Mauve."
    // to show alingment id of xmfa file
    value = field.value;
  } else if (field.name === 'Output ID') {
    title = "The specified output ID defines which gene tag in the attributes column (in the provided annotation file) should be used for TSS classification. Examples are 'locus_tag' or 'gene_id'."
  }

  if (studyType === 'condition' && field.name === 'Alignment ID') {
    disabled = true;
    value = id + 1;
  } else if(studyType === 'condition' && id > 0) {
    disabled = true;
  }

  return (
    <div className='text-field-box' title={title}>
      <label htmlFor={id}> {field.name}</label>
      <input disabled={disabled} className={disabled ? 'element text-field disabled-field' : 'element text-field'} type="text" 
              name={(field.name).toLowerCase().replace(' ', '')} defaultValue={value} id={id}
              onChange={(e) => handleTabs(e)} />
    </div>
  )
}

export default TextField