import React from 'react';
import ClipLoader from "react-spinners/ClipLoader";


/**
 * error/warning/info popup 
 * @param header: defines the type of popup (ERROR, WARNING, INFO)
 * @param error: the error/warning/info text
 * @param onCancel: function for pressing cancel button
 * @param onRun: function to start the tss prediction
 * @param sendAlignmentFile: INFO: send alignment file to server to read genome names/ids
 */

function LoadingBanner({ statusID, listDocumentStatus, readyLoaded, closePopup }) {
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const toggleCollapse = (isCollapsed) => setIsCollapsed(!isCollapsed)
    return (
        <div className='error-popup'>
            <div className='text-popup-inner'>
                <h3 className='header error-popup-header'>{readyLoaded === "loading" ? "Loading your data" :
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
                            {!readyLoaded ? "Loading" : "Check Status"}
                        </button>
                        <button className='button' disabled={readyLoaded !== "loaded"} onClick={() => closePopup()}>
                            Close
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );


}

export default LoadingBanner