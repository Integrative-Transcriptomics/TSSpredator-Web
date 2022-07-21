import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from './components/Main';
import Result from './components/Result';

function App() {
  
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Main/>} />
        <Route path="/result" element={<Result />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
