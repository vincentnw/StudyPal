import React, { useState, useEffect } from 'react';
import Flashcard from '../components/Flashcard';
import { AiOutlineFileAdd, AiOutlineMenu, AiOutlineHome, AiOutlineFileText } from 'react-icons/ai';
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UploadFile from '../components/UploadFile';

const FlashcardGenerator = () => {
    const [file, setFile] = useState(null);
    const [flashcards, setFlashcards] = useState([]);
    const [currentFlashcard, setCurrentFlashcard] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isFlipped, setIsFlipped] = useState(false);
    const [flipDirection, setFlipDirection] = useState('');
    const location = useLocation();

    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    const saveToSessionStorage = () => {
        sessionStorage.setItem('flashcards', JSON.stringify(flashcards));
        sessionStorage.setItem('currentFlashcard', currentFlashcard.toString());
    };

    useEffect(() => {
        if (flashcards.length > 0) {
            saveToSessionStorage();
        }
    }, [flashcards, currentFlashcard]);

    const loadFromSessionStorage = () => {
        const storedFlashcards = sessionStorage.getItem('flashcards');
        const storedCurrentFlashcard = sessionStorage.getItem('currentFlashcard');

        if (storedFlashcards) {
            setFlashcards(JSON.parse(storedFlashcards));
        }

        if (storedCurrentFlashcard) {
            setCurrentFlashcard(parseInt(storedCurrentFlashcard, 10));
        }
    };

    useEffect(() => {
        loadFromSessionStorage();
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.size > MAX_FILE_SIZE) {
            setError('File size exceeds the 30MB limit.');
            setFile(null);
        } else {
            setFile(selectedFile);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setError('Please upload a file');
            return;
        }

        setError('');
        setLoading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(process.env.REACT_APP_API_FLASHCARD, {
                method: 'POST',
                body: formData,
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let partialData = '';
            let flashcards = [];
            let done = false;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;

                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    partialData += chunk;

                    const lines = partialData.split('\n');
                    partialData = lines.pop();

                    lines.forEach((line) => {
                        if (line.trim()) {
                            try {
                                const parsedChunk = JSON.parse(line);

                                if (parsedChunk.progress) {
                                    setProgress(parsedChunk.progress);
                                }

                                if (parsedChunk.flashcards) {
                                    flashcards.push(...parsedChunk.flashcards);
                                }
                            } catch (err) {
                                console.error('Failed to parse chunk:', err);
                            }
                        }
                    });
                }
            }

            setFlashcards(parseFlashcards(flashcards));
        } catch (err) {
            setError('Failed to generate flashcards, please try again.');
            console.error('Error generating flashcards:', err);
        } finally {
            setLoading(false);
        }
    };

    const parseFlashcards = (rawFlashcards) => {
        const parsedFlashcards = [];

        for (let i = 0; i < rawFlashcards.length; i++) {
            const currentLine = rawFlashcards[i].trim();

            if (currentLine.startsWith('Q:') && rawFlashcards[i + 1] && rawFlashcards[i + 1].startsWith('A:')) {
                parsedFlashcards.push({
                    question: currentLine.replace('Q: ', ''),
                    answer: rawFlashcards[i + 1].replace('A: ', ''),
                });
            }
        }

        return parsedFlashcards;
    };

    const handleNext = () => {
        if (currentFlashcard < flashcards.length - 1) {
            setIsFlipped(false);
            setFlipDirection('right');
            setCurrentFlashcard(currentFlashcard + 1);
        }
    };

    const handlePrevious = () => {
        if (currentFlashcard > 0) {
            setIsFlipped(false);
            setFlipDirection('left');
            setCurrentFlashcard(currentFlashcard - 1);
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="min-h-screen flex bg-gray-50 relative">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <main className="flex-1 p-8">
                <UploadFile
                    handleFileChange={handleFileChange}
                    handleSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                    context="Flashcards"
                />

                {loading && (
                    <div className="bg-white p-4 rounded-lg shadow-md max-w-lg mb-8 mx-auto">
                        <p className="text-center font-bold mb-2">Generating Flashcards... {progress}%</p>
                        <div className="w-full bg-gray-300 rounded-full h-4">
                            <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {flashcards.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-lg shadow-md max-w-6xl mx-auto text-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentFlashcard}
                                initial={{ opacity: 0, x: flipDirection === 'right' ? 100 : -100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: flipDirection === 'right' ? -100 : 100 }}
                                transition={{ duration: 0.4 }}
                            >
                                <Flashcard
                                    question={flashcards[currentFlashcard].question}
                                    answer={flashcards[currentFlashcard].answer}
                                    isFlipped={isFlipped}
                                    setIsFlipped={setIsFlipped}
                                    flipDirection={flipDirection}
                                />
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex justify-center items-center mt-4 space-x-100">
                            <button
                                onClick={handlePrevious}
                                className={`text-white hover:underline ${currentFlashcard === 0 && 'opacity-50 cursor-not-allowed'}`}
                                disabled={currentFlashcard === 0}
                                style={{
                                    borderRadius: '50%',
                                    padding: '10px',
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <AiOutlineLeft size={20} color="#4A5568" />
                            </button>

                            <span className="text-white mx-4">
                                {currentFlashcard + 1} / {flashcards.length}
                            </span>

                            <button
                                onClick={handleNext}
                                className={`text-white hover:underline ${currentFlashcard === flashcards.length - 1 && 'opacity-50 cursor-not-allowed'}`}
                                disabled={currentFlashcard === flashcards.length - 1}
                                style={{
                                    borderRadius: '50%',
                                    padding: '10px',
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <AiOutlineRight size={20} color="#4A5568" />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FlashcardGenerator;
