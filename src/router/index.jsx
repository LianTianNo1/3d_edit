import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Editor3D from '../pages/Editor3D';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Editor3D />} />
      <Route path="/editor3d" element={<Editor3D />} />
    </Routes>
  );
};

export default AppRouter;
