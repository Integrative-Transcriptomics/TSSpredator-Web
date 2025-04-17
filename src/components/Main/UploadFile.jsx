import React from 'react';


/** individual button for uploading a file 
 * 
 * @param file: object -> field name 
 * @param id: id of the Genom/Replicate Tab
 * @param studyType: 'condtion' or 'genome'
 * @param genomes: genome/replicate object
 * @param saveIndividualFile: saves selected file
 * @param show: true <-> show upload files individually, false <-> hide this upload option
 * @param saveAnnotationFile: saves annotation files
 * @param multiFasta: true <-> genome file for this genome is multiFasta, else false
 */
function UploadFile({ file, id, studyType, genomes, saveIndividualFile, show, saveAnnotationFile, multiFasta }) {

  let disabled = false;
  if (studyType === 'condition' && id > 0) {
    disabled = true;
  }

  let label = (file.name).toLowerCase().replace(' ', '');
  // if label contains normal forward or normal reverse, change normal to non-enriched (control)
  // if (label.includes('normal')) {
  //   console.log(label);
  //   label = label.replace('normal', 'nonenriched');
  // }

  let fileName;
  let gIdx;
  let rIdx;
  // for replicate tab
  if (Array.isArray(id)) {
    rIdx = id[1];
    let rep = "replicate" + String.fromCharCode(97 + rIdx)
    fileName = genomes[rIdx][rep][label].name;

    // for genome files
  } else {
    gIdx = id;
    if (label === 'genomeannotation') {
      // multiple filenames possible -> go over array
      const fileArray = genomes[gIdx]['genome' + (gIdx + 1)][label];

      if (fileArray.length > 0) {
        fileName = '';
        // less than 4 files, show all file names
        if (fileArray.length < 4) {
          fileArray.forEach(file => {
            fileName += file.name + ', '
          });
          // remove last comma
          fileName = fileName.slice(0, -2);

          // more than 4 files, show only first 3 file names
        } else {
          for (let i = 0; i < 3; i++) {
            fileName += fileArray[i].name + ', ';
          }
          fileName += '...'
        }

      }
    } else {
      fileName = genomes[gIdx]['genome' + (gIdx + 1)][label].name;
    }
  }

  if (label === 'genomeannotation') {
    return (
      <div className={show ? 'file-box' : 'hidden'} data-title={file.tooltip}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: "50vw",
        }} >
        <p className='file-row'>{file.name}</p>
        <label className='element-row file-row element-text'>

          {multiFasta ?
            <><input disabled={disabled} className='element' type='file' name={label} id={id + 'annfile'} style={{ display: 'none' }}
              onChange={(e) => saveAnnotationFile(e)} directory=""
              webkitdirectory="" />

              <p className={disabled ? 'button disabled' : 'button'}>Select Folder</p>
              {typeof fileName === 'undefined' ? (disabled === true ? <p className='file-name'>No file(s) needed.</p> : <p className='file-name'>No file(s) selected.</p>)
                : <div className='file-name'> {fileName}</div>}
            </>
            : <>
              <input disabled={disabled} className='element' type='file' name={label} id={id + 'annfile'} style={{ display: 'none' }}
                onChange={(e) => saveAnnotationFile(e)} />

              <p className={disabled ? 'button disabled' : 'button'}>Select File</p>
              {typeof fileName === 'undefined' ? (disabled === true ? <p className='file-name'>No file needed.</p> : <p className='file-name'>No file selected.</p>)
                : <div className='file-name'> {fileName}</div>}
            </>
          }
        </label>
        </div>
      </div>
    )
  } else {
    return (
      <div className={show ? 'file-box' : 'hidden'} data-title={file.tooltip}>
         < div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: "50vw",
        }} >
        <p className='file-row'>{file.name.includes("normal") ? file.name.replace("normal", "non-enriched (control)") : file.name}</p>
        <label className='element-row file-row element-text'>

          <input disabled={disabled} className='element' type="file" name={label} id={id + 'file'} style={{ display: 'none' }}
            onChange={(e) => saveIndividualFile(e)} />

          <p className={disabled ? 'button disabled' : 'button'}>Select File</p>
          {typeof fileName === 'undefined' ? (disabled === true ? <p className='file-name'>No file needed.</p> : <p className='file-name'>No file selected.</p>)
            : <p className='file-name'>{fileName}</p>}
        </label>
        </div>
      </div>
    )
  }

}

export default UploadFile