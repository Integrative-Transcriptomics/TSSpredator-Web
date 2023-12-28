import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from './components/Main';
import Result from './components/Result';
import Test from './components/Test';

function App() {
  
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Main/>} />
        <Route path="/result/:filePath" element={<Result />} />
        <Route path="/status/:id" element={<Test />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
