import ClipLoader from "react-spinners/ClipLoader";
import React from "react";
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook } from '@fortawesome/pro-light-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import '../../css/Header.css';


function Header({ loading, onLoadExampleData, showExamples = false, statusID = null, startZipUpload }) {

  return <header>

    <div className="header-left">
      <h1><Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>TSSpredator</Link></h1>
      <div>
        <Link to="https://tsspredator20-rtd.readthedocs.io/en/latest/index.html" style={{ textDecoration: 'none', color: 'inherit' }}>
          <FontAwesomeIcon icon={faBook} />
        </Link>
      </div>
      <div>
        <Link to="https://github.com/Integrative-Transcriptomics/TSSpredator-GUI" style={{ textDecoration: 'none', color: 'inherit' }}>
          <FontAwesomeIcon icon={faGithub} />
        </Link>
      </div>
      {statusID && (
        <div className="small-url">
          Last prediction sent:
          <Link className="url" to={`/status/${statusID}`} style={{ color: 'inherit' }}> {statusID}</Link>
        </div>
      )}


    </div>

    {
      true &&
      <div className='dropdown'>
        <button className='dropbtn'
          style={{ paddingRight: '0.5em', paddingLeft: '0.5em' }}
          onClick={() => { startZipUpload(true) }}
        >Upload Zip for Visualization
        </button>

      </div>
    }

    {
      showExamples &&
      <div className='dropdown'>
        {loading[1] ? (
          <div className='loading'>
            <ClipLoader color='white' loading={loading[0]} size={20} />
          </div>
        ) : (
          <>
            <button className='dropbtn'>Load Example Data</button>
            <div className='dropdown-content'>
              <button name='campylobacter' type='button' onClick={(e) => onLoadExampleData(e)}>
                Campylobacter jejuni
              </button>
              <button name='pseudomonas' type='button' onClick={(e) => onLoadExampleData(e)}>
                Pseudomonas aeruginosa
              </button>
            </div>
          </>
        )}
      </div>
    }
  </header >;
}

export default Header;