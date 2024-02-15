import React from 'react';
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from "react-router-dom";
import Main from './components/Main';
import Result from './components/Result';
import StatusSite from './components/StatusSite';
import NotFoundPage from './components/404Page';

function App() {
  const router = createBrowserRouter(createRoutesFromElements(
    <>
      <Route path="/" element={<Main />} />
      <Route path="/result/:filePath" element={<Result />} />
      <Route path="/status/:id" element={<StatusSite />} />
      <Route path="*" element={<NotFoundPage />} />
    </>

  ));

  return (
    <RouterProvider router={router} />
  )
}

export default App
