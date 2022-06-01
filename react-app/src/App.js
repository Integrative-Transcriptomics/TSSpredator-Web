import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from './components/Main';
import Result from './components/Result';

function App() {
  
  const [state, setState] = useState('test')

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Main a={() => setState('aaaaaaa')}/>} />
        <Route path="/result" element={<Result a={state}/>} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
