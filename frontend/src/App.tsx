import React from 'react';
import Home from './pages/Home'
import SensorDetails from './pages/SensorDetails.tsx'
import {BrowserRouter, Route, Routes} from 'react-router-dom';

const App: React.FC = () => {
    return (
        <div className="relative w-full min-h-screen bg-gray-900 flex flex-col">
            <header className="w-full bg-gray-800 shadow-md px-6 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-100">DomoDomo</h1>
                <nav>
                    <ul className="flex space-x-4">
                        <li>
                            <a href="#" className="text-gray-100 hover:text-gray-800">About</a>
                        </li>
                    </ul>
                </nav>
            </header>


            <BrowserRouter>
                <Routes>
                    <Route path='/' element={<Home/>}></Route>
                    <Route path="/sensors/:id" element={<SensorDetails/>}/>
                </Routes>
            </BrowserRouter>
        </div>
    );
};

export default App;