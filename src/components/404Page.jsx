import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Main/Header';
const NotFoundPage = () => {
    return (
        <>
            <Header />
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h1>404 - Not Found!</h1>
                <p>Sorry, the page you are looking for does not exist.</p>
                <p>You can always go back to the <Link to="/">homepage</Link>.</p>
            </div>
        </>
    );
};

export default NotFoundPage;
