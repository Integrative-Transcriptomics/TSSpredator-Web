import React, { useState } from 'react';
function ConfigList({ configData }) {
    const [showConfig, setShowConfig] = useState(false);
    return <div style={{ maxWidth: "60%" }}>


        <h3 className='header click-param' onClick={() => setShowConfig(!showConfig)}>
            {showConfig ? "-" : "+"} Show config used
        </h3>
        <div className={!showConfig && " hidden"} >
            {
                !configData ? null : <div

                >
                    <h4>Config used for TSS prediction:</h4>
                    <div className="file-list">
                        {Object.keys(configData).map((key) => (
                            <div key={key} className='file-list-item'>
                                <div className='file-name'>{key}</div>
                                <div className='file-name'>
                                    {configData[key]}
                                </div>
                            </div>
                        ))}

                    </div>

                </div>
            }
        </div>
    </div>
}

export default ConfigList;