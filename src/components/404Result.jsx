import React from 'react';
import { Link } from 'react-router-dom';
const ResultNotFoundPage = ({ filePath }) => {
    return (
        <>
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h1>404 - Not Found!</h1>
                <p className='text-404'>Sorry, no result with the ID {filePath} can be found.</p>
                <p className='text-404'>Results are only available for seven days after creation. </p>
                <p className='text-404'>You can always go back to the <Link to="/">homepage</Link> and upload the corresponding zip for visualization or redo your analysis.</p>
            </div>
        </>
    );
};

export default ResultNotFoundPage;
