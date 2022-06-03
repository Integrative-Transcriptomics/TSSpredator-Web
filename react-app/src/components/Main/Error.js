import React from 'react';

function Error({ header, error, onClick }) {
    return (
        <div className='error-popup'>
            <div className='error-popup-inner'>
                <h3 className='header error-popup-header'>{header}</h3>
                <div className='error-field'>{error}</div>
                <div className='error-button'>
                    <button className='button error' onClick={() => onClick()}>OK</button>
                </div>

            </div>
        </div>
    )
}

export default Error