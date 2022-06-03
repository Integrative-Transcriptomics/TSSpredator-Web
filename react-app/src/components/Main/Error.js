import React from 'react';

function Error({ header, error, onCancel, onRun }) {
    return (
        <div className='error-popup'>
            <div className='error-popup-inner'>
                <h3 className='header error-popup-header'>{header}</h3>
                <div className='error-field'>{error}</div>
                <div className='error-button'>
                    {header === 'ERROR' ? <button className='button error' onClick={() => onCancel()}>OK</button>
                        : <><button className='button error' onClick={() => onCancel()}>Cancel</button>
                            <button className='button error' onClick={() => onRun()}>Continue</button></>}

                </div>
            </div>
        </div>
    )
}

export default Error