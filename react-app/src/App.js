import React, { useState, useEffect } from 'react';

function App() {

  const [data, setData] = useState([{}]);

  useEffect(() => {

    fetch("/obst/").then(
      res => res.json())
      .then(
        data => {
          setData(data)
          console.log(data)
        }
        )
  }, []);


  return (
    <div>

      {(typeof data.obst === 'undefined') ? (
        <p>Loading...</p>
      ) : (
        data.obst.map((obst, i) => (
          <p key={i}>{obst}</p>
        ))
      )}
      
    </div>
  )
}

export default App