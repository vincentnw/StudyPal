import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid';
import Footer from '../components/Footer';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const DEFAULT_AVATAR_URL = process.env.REACT_APP_DEFAULT_AVATAR_URL;
const ANIMATION_DELAY_MS = parseInt(process.env.REACT_APP_ANIMATION_DELAY_MS) || 500;

const LoggedInHome = () => {
    const navigate = useNavigate();
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [user, setUser] = useState(null);

    const toggleDropdown = () => setDropdownVisible(!dropdownVisible);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) setUser(user);
            else navigate('/');
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleNavigation = (url) => {
        document.body.classList.add('fade-out');
        setTimeout(() => {
            document.body.classList.remove('fade-out');
            navigate(url);
        }, ANIMATION_DELAY_MS);
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            console.log('User signed out');
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative">
            <section className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-20 relative">
                <div className="container mx-auto px-6">
                    <div className="absolute top-5 right-5 z-20">
                        <div
                            onClick={toggleDropdown}
                            className={`cursor-pointer bg-white text-black px-4 py-2 shadow-md border transition-all duration-300 transform ${dropdownVisible ? "w-56 h-auto rounded-lg" : "w-56 h-16 rounded-full hover:scale-105"}`}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: dropdownVisible ? '12px' : '50px',
                                transitionProperty: "width, height, transform",
                            }}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={user?.photoURL || DEFAULT_AVATAR_URL}
                                        alt="User Profile"
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">Hello,</span>
                                        <span className="text-sm text-ellipsis overflow-hidden whitespace-nowrap" style={{ maxWidth: '140px' }}>
                                            {user?.displayName || "Anonymous"}
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-auto">
                                    {dropdownVisible ? (
                                        <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>
                            </div>
                            {dropdownVisible && (
                                <div className="mt-4 w-full">
                                    <Link to="/account" className="block text-sm py-2 hover:underline">
                                        My Account
                                    </Link>
                                    <button onClick={handleSignOut} className="block text-sm py-2 hover:underline w-full text-left">
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-center">
                        <h1 className="text-5xl font-bold mb-4">Welcome Back, {user?.displayName || "Friend"}!</h1>
                        <p className="text-xl mb-8">Ready to continue your learning journey? Choose an option below to get started.</p>
                    </div>
                    <div className="flex justify-center space-x-6">
                        {['note-generator', 'flashcard-generator', 'quiz-generator'].map((path, idx) => (
                            <motion.button
                                key={path}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105"
                                onClick={() => handleNavigation(`/${path}`)}
                            >
                                {path.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </motion.button>
                        ))}
                    </div>
                    <div className="absolute z-10 bottom-0 left-0 w-32 h-32 bg-purple-400 rounded-full opacity-50 transform translate-x-16 -translate-y-12"></div>
                    <div className="absolute z-10 top-0 right-40 w-48 h-48 bg-blue-400 rounded-full opacity-50 transform -translate-x-16 translate-y-16"></div>
                </div>
            </section >
            <section className="container mx-auto px-6 py-16 text-center">
                <h2 className="text-3xl font-bold mb-8">Continue Learning</h2>
                <p className="text-lg mb-4">Remember: "The only limit to your success is the amount of effort you're willing to put in."</p>
                <p className="text-lg text-gray-700">Whether you're making notes or preparing quizzes, every step brings you closer to mastery.</p>
            </section>
            <section className="container mx-auto px-6 py-16">
                <h2 className="text-4xl font-bold text-center mb-12">Why Use StudyPal?</h2>
                <div className="flex flex-wrap justify-center">
                    {['Easy Note Generation', 'Flashcards & Quizzes', 'Save Time'].map((feature, idx) => (
                        <div key={idx} className="w-full md:w-1/3 p-4">
                            <div className="bg-white shadow-lg rounded-lg p-6 text-center transition transform hover:scale-105 duration-300">
                                <div className="bg-blue-600 text-white w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M9 16h6m-7-4h8a2 2 0 100-4h-8a2 2 0 100 4z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feature}</h3>
                                <p>{feature === 'Save Time' ? 'Spend less time organizing study materials and more time learning.' : 'Upload study materials and generate structured notes quickly.'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default LoggedInHome;
