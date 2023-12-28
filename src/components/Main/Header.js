import ClipLoader from "react-spinners/ClipLoader";
import React from "react";

function Header({loading, onLoadExampleData}) {

    return <header>
      <h1>TSSpredator</h1>
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
    </header>;
  }

  export default Header;