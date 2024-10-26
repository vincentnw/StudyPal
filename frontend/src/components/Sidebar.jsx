import React, { useState, useEffect, useContext } from 'react';
import { AiOutlineMenu, AiOutlineHome, AiOutlineFileText, AiOutlineFileAdd, AiOutlineCheckSquare } from 'react-icons/ai';
import { useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user, loading } = useContext(AuthContext);
    const DEFAULT_AVATAR_URL = process.env.REACT_APP_DEFAULT_AVATAR_URL;

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
        localStorage.setItem('sidebarOpen', !sidebarOpen ? 'true' : 'false');
    };

    useEffect(() => {
        const storedSidebarState = localStorage.getItem('sidebarOpen');
        if (storedSidebarState === 'false') {
            setSidebarOpen(false);
        }
    }, []);

    const getIconClass = (path) => {
        return !sidebarOpen && location.pathname === path ? 'bg-indigo-600/40 p-2 rounded-lg' : '';
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <aside className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'} bg-gradient-to-r from-purple-500 to-blue-500 text-white flex flex-col justify-between`}>
            <div>
                <div className="p-4 flex items-center justify-between">
                    <span className={`text-2xl font-bold ${!sidebarOpen && 'hidden'}`}>StudyPal</span>
                    <button onClick={toggleSidebar} className="focus:outline-none text-white">
                        <AiOutlineMenu size={24} />
                    </button>
                </div>
                <nav>
                    <ul className="space-y-4 p-4">
                        <li className={`flex items-center ${!sidebarOpen ? 'justify-center' : 'space-x-4'} ${sidebarOpen && location.pathname === process.env.REACT_APP_HOME_URL ? 'bg-indigo-600/40 p-2 rounded-lg' : ''}`}>
                            <Link to={process.env.REACT_APP_HOME_URL} className={getIconClass(process.env.REACT_APP_HOME_URL)}>
                                <AiOutlineHome size={sidebarOpen ? 24 : 32} className={`${location.pathname === process.env.REACT_APP_HOME_URL ? 'text-white' : 'text-gray-300'}`} />
                            </Link>
                            {sidebarOpen && <Link to={process.env.REACT_APP_HOME_URL} className={`hover:text-gray-200 ${location.pathname === process.env.REACT_APP_HOME_URL && 'font-bold'}`}>Home</Link>}
                        </li>
                        <li className={`flex items-center ${!sidebarOpen ? 'justify-center' : 'space-x-4'} ${sidebarOpen && location.pathname === process.env.REACT_APP_NOTE_GENERATOR_URL ? 'bg-indigo-600/40 p-2 rounded-lg' : ''}`}>
                            <Link to={process.env.REACT_APP_NOTE_GENERATOR_URL} className={getIconClass(process.env.REACT_APP_NOTE_GENERATOR_URL)}>
                                <AiOutlineFileText size={sidebarOpen ? 24 : 32} className={`${location.pathname === process.env.REACT_APP_NOTE_GENERATOR_URL ? 'text-white' : 'text-gray-300'}`} />
                            </Link>
                            {sidebarOpen && <Link to={process.env.REACT_APP_NOTE_GENERATOR_URL} className={`hover:text-gray-200 ${location.pathname === process.env.REACT_APP_NOTE_GENERATOR_URL && 'font-bold'}`}>Note</Link>}
                        </li>
                        <li className={`flex items-center ${!sidebarOpen ? 'justify-center' : 'space-x-4'} ${sidebarOpen && location.pathname === process.env.REACT_APP_FLASHCARD_GENERATOR_URL ? 'bg-indigo-600/40 p-2 rounded-lg' : ''}`}>
                            <Link to={process.env.REACT_APP_FLASHCARD_GENERATOR_URL} className={getIconClass(process.env.REACT_APP_FLASHCARD_GENERATOR_URL)}>
                                <AiOutlineFileAdd size={sidebarOpen ? 24 : 32} className={`${location.pathname === process.env.REACT_APP_FLASHCARD_GENERATOR_URL ? 'text-white' : 'text-gray-300'}`} />
                            </Link>
                            {sidebarOpen && <Link to={process.env.REACT_APP_FLASHCARD_GENERATOR_URL} className={`hover:text-gray-200 ${location.pathname === process.env.REACT_APP_FLASHCARD_GENERATOR_URL && 'font-bold'}`}>Flashcard</Link>}
                        </li>
                        <li className={`flex items-center ${!sidebarOpen ? 'justify-center' : 'space-x-4'} ${sidebarOpen && location.pathname === process.env.REACT_APP_QUIZ_GENERATOR_URL ? 'bg-indigo-600/40 p-2 rounded-lg' : ''}`}>
                            <Link to={process.env.REACT_APP_QUIZ_GENERATOR_URL} className={getIconClass(process.env.REACT_APP_QUIZ_GENERATOR_URL)}>
                                <AiOutlineCheckSquare size={sidebarOpen ? 24 : 32} className={`${location.pathname === process.env.REACT_APP_QUIZ_GENERATOR_URL ? 'text-white' : 'text-gray-300'}`} />
                            </Link>
                            {sidebarOpen && <Link to={process.env.REACT_APP_QUIZ_GENERATOR_URL} className={`hover:text-gray-200 ${location.pathname === process.env.REACT_APP_QUIZ_GENERATOR_URL && 'font-bold'}`}>Quiz</Link>}
                        </li>
                    </ul>
                </nav>
            </div>
            <div className="p-4">
                <Link to={process.env.REACT_APP_ACCOUNT_URL} className={`flex items-center space-x-4 ${sidebarOpen && location.pathname === process.env.REACT_APP_ACCOUNT_URL ? 'bg-indigo-600/40 p-2 rounded-lg' : ''}`}>
                    <img
                        src={user?.photoURL || DEFAULT_AVATAR_URL}
                        alt="User Avatar"
                        className={`w-10 h-10 rounded-full ${sidebarOpen ? '' : 'mx-auto'}`}
                    />
                    {sidebarOpen && (
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">{user?.displayName || user?.email || "user@gmail.com"}</span>
                        </div>
                    )}
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;
