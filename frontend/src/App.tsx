import React from 'react';
import Home from './pages/Home'
import SensorDetails from './components/SensorDetails'
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const App: React.FC = () => {
    return (
      <>
        <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />}></Route>
          <Route path="/sensor/:id" element={<SensorDetails />} />
          </Routes>
      </BrowserRouter>
      </>
    );
};

export default App;