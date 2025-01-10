import React from 'react';
import Home from './pages/Home'
import SensorDetails from './pages/SensorDetails.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Error403 from "./errors/Error403.tsx";
import Error404 from "./errors/Error404.tsx";
import Error500 from "./errors/Error500.tsx";

const App: React.FC = () => {
    return (
        <div className="relative w-full min-h-screen bg-gray-900 flex flex-col">
            <header className="w-full bg-gray-800 shadow-md px-6 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-100">DomoDomo</h1>
                <nav>

                </nav>
            </header>

            <BrowserRouter>
                <Routes>
                    <Route path='/' element={<Home />}></Route>
                    <Route path="/sensors/:id" element={<SensorDetails />} />
                    <Route path="/403" element={<Error403 />} />
                    <Route path="/500" element={<Error500 />} />
                    <Route path="*" element={<Error404 />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
};

export default App;