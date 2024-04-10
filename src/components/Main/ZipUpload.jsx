import React from 'react';
import { useState } from 'react';
import { ClipLoader } from "react-spinners";
import JSZip from "jszip";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/pro-light-svg-icons';

/**
 * popup window for uploading config file and folder that contains all needed files
 * @param header: header of the popup
 * @param text: text in the popup
 * @param uploadConfig: function for uploading the config file
 * @param uploadConfFiles: function for uploading all files
 */
function ZipUpload({ closePopup }) {
    const [loading, setLoading] = useState("upload"); // upload or loading or error or success
    const [filePathResults, setFilePathResults] = useState(null);
    const [errorAlert, setError] = useState(null);

    const checkZipFile = async (file) => {
        // check if the zip file is valid
        // Get list of files in the zip file
        const zip = new JSZip();
        let zipFile = await zip.loadAsync(file);
        let folderName = "";
        zipFile.forEach((relativePath, file) => {
            if (file.dir) {
                folderName = relativePath;
            }
        }
        );
        if (folderName !== "") {
            zipFile = zipFile.folder(folderName);
        }
        // Check if MasterTable.tsv is in the zip file
        if (zipFile.file("MasterTable.tsv") === null) {
            setLoading('error');
            setError('Error: MasterTable.tsv not found in the zip file. \n Are you sure you uploaded files computed by TSSpredator-Web?');
            return false;
        }
        else {
            // get prefixes of analyzed genomes
            const prefixes = [];
            // get all files ending in _super.gff
            zipFile.forEach((relativePath, file) => {
                if (relativePath.endsWith("_super.gff")) {
                    prefixes.push(relativePath.split('_super.gff')[0]);
                }
            }
            );
            let relevantSuffixes = ["_super.fa", "_superFivePrimeMinus_avg.bigwig", "_superFivePrimePlus_avg.bigwig", "_superNormalPlus_avg.bigwig", "_superNormalMinus_avg.bigwig"];
            // check if for all prefixes there is a _super.fa file and four files ending with _avg.bigwig
            prefixes.forEach((prefix) => {
                let found = true;
                relevantSuffixes.forEach((suffix) => {
                    if (zipFile.file(prefix + suffix) === null) {
                        found = false;
                    }
                });
                if (!found) {
                    setLoading('error');
                    setError('Error: Not all files found for genome ' + prefix);
                    return false;
                }
            })
        }
        let zippedFile = await zipFile.generateAsync({ type: "blob" });
        zippedFile = new File([zippedFile], "zippedFiles.zip", { type: "application/zip" });
        return zippedFile;

        ;
    }
    const startZipUpload = async (e) => {
        const file = e.target.files[0];
        setLoading('loading');
        let checkedZipped = await checkZipFile(file);
        if (errorAlert) {
            setLoading('error');
            return;
        }
        if (!checkedZipped) {
            console.log("Error in zip file")
            return;
        }
        const formData = new FormData();
        formData.append('file', checkedZipped);
        fetch('/api/zipUpload/', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                setLoading('success');
                setFilePathResults(data['filePath']);
            })
            .catch(error => {
                setLoading('error');
                setError('Error:' + error);
            });


    }

    return (

        <div className='error-popup'>

            <div className='error-popup-inner'>



                {
                    // match the loading state
                    loading === 'upload' ?
                        <>
                            <div className='header error-popup-header' style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div />
                                <h3 style={{ textAlign: "center" }}> Upload Zip File</h3>
                                <FontAwesomeIcon style={{ "cursor": "pointer", color: "#ffa000", marginRight: "5px" }} onClick={() => {
                                    closePopup()
                                }} size="xl" icon={faCircleXmark} />
                            </div>


                            <div className='error-field'>Please Upload a Zip File generated with TSSPredator-Web</div>
                            <div className='error-button'>
                                <label className='button error'> Upload Zip File
                                    <input type='file' onChange={(e) => startZipUpload(e)} style={{ display: 'none' }} />
                                </label>
                            </div>
                        </>
                        : loading === 'loading' ?
                            <>
                                <h3 className='header error-popup-header'>Uploading files</h3>
                                <div className='error-field'>Please wait while the files are being processed</div>
                                <div className='error-field'>
                                    <ClipLoader color='#ffa000' size={30} />
                                </div>

                            </>
                            : loading === 'error' ?
                                <>
                                    <h3 className='header error-popup-header'>Error</h3>
                                    <div className='error-field'>An error occurred while processing the files</div>
                                    <div className='error-field'>{errorAlert}</div>
                                </>
                                : loading === 'success' ?
                                    <>
                                        <h3 className='header error-popup-header'>Success</h3>
                                        <div className='error-field'>Files have been successfully processed</div>
                                        <a className='button error'
                                            style={{ maxWidth: "30%", alignContent: "center", margin: "auto", textDecoration: "none" }}
                                            href={`/result/${filePathResults}`}>Show results</a>
                                    </>
                                    : null
                }

            </div>
        </div >
    )
}

export default ZipUpload