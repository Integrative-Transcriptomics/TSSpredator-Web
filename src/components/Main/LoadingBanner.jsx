import React from 'react';
import { useEffect } from 'react';
import ClipLoader from "react-spinners/ClipLoader";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/pro-light-svg-icons';


/** creates a loading banner
 *  
 * @param statusID: id of the status page
 * @param listDocumentStatus: object -> file labels
 * @param readyLoaded: 'loading' or 'loaded'
 * @param closePopup: close the loading banner
 *  
 * @return loading banner
 *  
* @example
* statusID = '1234'
* listDocumentStatus = {'file1': 'success', 'file2': 'error'}
* readyLoaded = 'loaded'
* closePopup = () => {console.log('close')}
*   
* <LoadingBanner statusID={statusID} listDocumentStatus={listDocumentStatus} readyLoaded={readyLoaded} closePopup={closePopup} />
*   
*/
function LoadingBanner({ statusID, listDocumentStatus, readyLoaded, closePopup }) {
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const toggleCollapse = (isCollapsed) => setIsCollapsed(!isCollapsed)
    useEffect(() => { console.log(listDocumentStatus) }, [listDocumentStatus]);
    return (
        <div className='error-popup'>
            <div className='text-popup-inner'>
                <div className='close-popup'>
                    <FontAwesomeIcon style={{ "cursor": readyLoaded === "loaded" ? "pointer" : "not-allowed", color: "#ffa000" }} onClick={() => {
                        if (readyLoaded === "loaded") {
                            closePopup()
                        }
                    }} size="xl" icon={faCircleXmark} />
                </div>
                <h3 className='header error-popup-header'>{readyLoaded === "loading" ? "Uploading your data" :
                    "Succesfull upload"}</h3>


                <div className='loading-popup-body'>
                    <div className='loading-text-field' >
                        {readyLoaded === "loading" ? "Your data is being uploaded. Please wait and do not close the window" :
                            "Your data was successfully uploaded. You can now go to the status page."}
                    </div>

                    {/* Collapsible section header */}
                    <div className='collapsible-header' onClick={() => toggleCollapse(isCollapsed)}>
                        {isCollapsed ? (
                            <>
                                <span>Show Files</span>
                                <span className='arrow'>↓</span>
                            </>
                        ) : (
                            <>
                                <span>Hide Files</span>
                                <span className='arrow'>↑</span>
                            </>
                        )}
                    </div>

                    {/* Collapsible content */}
                    {!isCollapsed && (
                        <div className='file-list'>
                            {Object.keys(listDocumentStatus).map((key) => (
                                <div key={key} className='file-list-item'>
                                    <div className='file-name'>{key}</div>
                                    <div className='file-status'>
                                        {!listDocumentStatus[key] ? (
                                            <ClipLoader color='orange' loading={!listDocumentStatus[key]} size={20} />
                                        ) : listDocumentStatus[key] === 'success' ? (
                                            <span style={{ color: 'green' }}>✔</span>
                                        ) : (
                                            <span style={{ color: 'red' }}>✖</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className='button-container'>
                        <button className='button error' disabled={readyLoaded !== "loaded"} onClick={() => window.open("/status/" + statusID, "_blank")}>
                            {!readyLoaded ? "Loading" : "Go To Status Page"}
                        </button>

                    </div>
                </div>

            </div>
        </div>
    );


}

export default LoadingBanner