import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from './components/Main';
import Result from './components/Result';
import StatusSite from './components/StatusSite';

function App() {
  
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Main/>} />
        <Route path="/result/:filePath" element={<Result />} />
        <Route path="/status/:id" element={<StatusSite />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
