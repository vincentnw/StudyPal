import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { motion } from 'framer-motion';
import { AiOutlineArrowRight } from 'react-icons/ai';
import Footer from '../components/Footer';

const Home = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => setIsAuthenticated(!!user));
        return unsubscribe;
    }, []);

    const renderActionButton = useCallback(() => (
        <Link to={isAuthenticated ? "/home" : "/login"}>
            <button className="bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold py-4 px-10 rounded-full shadow-lg hover:scale-110 transform transition duration-300 ease-in-out flex items-center space-x-2">
                <span>{isAuthenticated ? "Go to Dashboard" : "Get Started"}</span>
                <AiOutlineArrowRight size={24} />
            </button>
        </Link>
    ), [isAuthenticated]);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-500 to-blue-500 overflow-hidden relative">
            <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
            <div className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-4000"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-6000"></div>
            <div className="absolute top-[450px] left-[100px] w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply filter blur-lg opacity-60 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[100px] right-[80px] w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-lg opacity-60 animate-blob animation-delay-4000"></div>

            <section className="text-white py-20 relative flex-grow z-10">
                <div className="container mx-auto px-6 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="text-6xl font-extrabold mb-6"
                    >
                        Transform Your Study Experience
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, delay: 0.3 }}
                        className="text-xl mb-8"
                    >
                        Simplify your learning process with StudyPal’s note generation, quizzes, and flashcards.
                    </motion.p>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex justify-center"
                    >
                        {renderActionButton()}
                    </motion.div>
                </div>
            </section>
            <section className="container mx-auto px-6 py-16 z-10 relative">
                <h2 className="text-4xl font-extrabold text-center mb-12 text-gray-100">Why Choose StudyPal?</h2>
                <div className="flex flex-wrap justify-center space-y-8 md:space-y-0">
                    {[
                        {
                            title: "Instant Note Generation",
                            description: "Upload your study materials and generate structured notes with just a click.",
                            iconPath: "M8 12h.01M12 12h.01M16 12h.01M9 16h6m-7-4h8a2 2 0 100-4h-8a2 2 0 100 4z",
                        },
                        {
                            title: "Flashcards & Quizzes",
                            description: "Turn your materials into flashcards and quizzes to master your subjects quickly.",
                            iconPath: "M19 9l-7 7-7-7",
                        },
                        {
                            title: "Save Time, Study More",
                            description: "Focus on learning instead of organizing by using StudyPal’s automated tools.",
                            iconPath: "M5 13l4 4L19 7",
                        },
                    ].map((feature, index) => (
                        <motion.div
                            key={index}
                            className="w-full md:w-1/3 p-4"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <div className="bg-white shadow-lg rounded-lg p-8 text-center transition transform hover:shadow-xl duration-300">
                                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.iconPath} />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-gray-800">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default React.memo(Home);
