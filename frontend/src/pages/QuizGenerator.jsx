import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import UploadFile from '../components/UploadFile';
import Quiz from '../components/Quiz';
import { AiOutlineFlag, AiFillFlag } from 'react-icons/ai';
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';

const QuizGenerator = () => {
    const [file, setFile] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [progress, setProgress] = useState(0);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [answeredQuizzes, setAnsweredQuizzes] = useState([]);

    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    const saveToSessionStorage = () => {
        sessionStorage.setItem('quizzes', JSON.stringify(quizzes));
        sessionStorage.setItem('progress', progress.toString());
        sessionStorage.setItem('answeredQuizzes', JSON.stringify(answeredQuizzes));
    };

    const loadFromSessionStorage = () => {
        const storedQuizzes = sessionStorage.getItem('quizzes');
        const storedProgress = sessionStorage.getItem('progress');
        const storedAnsweredQuizzes = sessionStorage.getItem('answeredQuizzes');

        if (storedQuizzes) {
            setQuizzes(JSON.parse(storedQuizzes));
        }
        if (storedProgress) {
            setProgress(parseInt(storedProgress, 10));
        }
        if (storedAnsweredQuizzes) {
            setAnsweredQuizzes(JSON.parse(storedAnsweredQuizzes));
        }
    };

    useEffect(() => {
        if (quizzes.length > 0) {
            saveToSessionStorage();
        }
    }, [quizzes, progress, answeredQuizzes]);

    useEffect(() => {
        loadFromSessionStorage();
    }, []);

    useEffect(() => {
        console.log("Total Quizzes Parsed: ", quizzes.length);
    }, [quizzes]);

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
            const response = await fetch(process.env.REACT_APP_API_QUIZ, {
                method: 'POST',
                body: formData,
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let partialData = '';

            let generatedQuizzes = [];
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
                                if (parsedChunk.quizzes) {
                                    generatedQuizzes.push(...parsedChunk.quizzes);
                                    setQuizzes([...generatedQuizzes]);
                                    setAnsweredQuizzes(Array(generatedQuizzes.length).fill({ selectedAnswer: null, isChecked: false, isFlagged: false }));
                                }
                            } catch (err) {
                                console.error('Failed to parse chunk:', err);
                            }
                        }
                    });
                }
            }
        } catch (err) {
            setError('Failed to generate quizzes, please try again.');
            console.error('Error generating quizzes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentQuizIndex < quizzes.length - 1) {
            setCurrentQuizIndex(currentQuizIndex + 1);
            setSelectedAnswer(answeredQuizzes[currentQuizIndex + 1]?.selectedAnswer || null);
            setIsChecked(answeredQuizzes[currentQuizIndex + 1]?.isChecked || false);
        }
    };

    const handlePrevious = () => {
        if (currentQuizIndex > 0) {
            setCurrentQuizIndex(currentQuizIndex - 1);
            setSelectedAnswer(answeredQuizzes[currentQuizIndex - 1]?.selectedAnswer || null);
            setIsChecked(answeredQuizzes[currentQuizIndex - 1]?.isChecked || false);
        }
    };

    const jumpToQuiz = (index) => {
        setCurrentQuizIndex(index);
        setSelectedAnswer(answeredQuizzes[index]?.selectedAnswer || null);
        setIsChecked(answeredQuizzes[index]?.isChecked || false);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleCheckAnswer = () => {
        setIsChecked(true);
        const updatedAnsweredQuizzes = [...answeredQuizzes];
        updatedAnsweredQuizzes[currentQuizIndex] = { ...answeredQuizzes[currentQuizIndex], selectedAnswer, isChecked: true };
        setAnsweredQuizzes(updatedAnsweredQuizzes);
    };

    const handleFlagQuiz = () => {
        const updatedAnsweredQuizzes = [...answeredQuizzes];
        const currentQuiz = { ...updatedAnsweredQuizzes[currentQuizIndex] };
        currentQuiz.isFlagged = !currentQuiz.isFlagged;
        updatedAnsweredQuizzes[currentQuizIndex] = currentQuiz;
        setAnsweredQuizzes(updatedAnsweredQuizzes);
    };

    const getButtonClass = (index) => {
        const quiz = answeredQuizzes[index];
        if (!quiz) return 'bg-gray-300 hover:bg-gray-400';

        if (quiz.isChecked) {
            if (quiz.selectedAnswer === quizzes[index].correctAnswer) {
                return 'bg-green-500 hover:bg-green-600';
            } else {
                return 'bg-red-500 hover:bg-red-600';
            }
        }
        if (quiz.isFlagged) {
            return 'bg-yellow-500 hover:bg-yellow-600';
        }
        if (index === currentQuizIndex) {
            return 'bg-blue-500 hover:bg-blue-600';
        }
        return 'bg-gray-300 hover:bg-gray-400';
    };

    return (
        <div className="min-h-screen flex bg-gray-50 relative">
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
            <main className="flex-1 p-8 flex">
                <div className="flex w-full items-start">
                    <div className="w-3/4">
                        <UploadFile
                            handleFileChange={handleFileChange}
                            handleSubmit={handleSubmit}
                            loading={loading}
                            error={error}
                            context="Quizzes"
                        />
                        {loading && (
                            <div className="bg-white p-4 rounded-lg shadow-md max-w-lg mb-8 mx-auto">
                                <p className="text-center font-bold mb-2">Generating Quizzes... {progress}%</p>
                                <div className="w-full bg-gray-300 rounded-full h-4">
                                    <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        )}
                        {quizzes.length > 0 && (
                            <>
                                <div className="relative w-full max-w-4xl mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg shadow-lg p-8 mt-4">
                                    <div className="flex flex-col items-center text-white">
                                        <h3 className="text-2xl font-bold">
                                            Question {currentQuizIndex + 1}/{quizzes.length}
                                        </h3>
                                        <div className="w-full mt-6">
                                            <AnimatePresence mode="wait">
                                                {quizzes[currentQuizIndex] && (
                                                    <motion.div
                                                        key={currentQuizIndex}
                                                        initial={{ opacity: 0, x: 100 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -100 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="text-lg bg-white p-6 rounded-lg shadow-lg text-black"
                                                    >
                                                        <Quiz
                                                            question={quizzes[currentQuizIndex].question}
                                                            choices={quizzes[currentQuizIndex].choices}
                                                            correctAnswer={quizzes[currentQuizIndex].correctAnswer}
                                                            selectedAnswer={selectedAnswer}
                                                            setSelectedAnswer={setSelectedAnswer}
                                                            isChecked={isChecked}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="flex justify-between items-center w-full mt-4">
                                            <button
                                                onClick={handlePrevious}
                                                disabled={currentQuizIndex === 0}
                                                className="bg-transparent hover:bg-gray-100 hover:bg-opacity-30 text-white font-bold py-2 px-4 rounded-full"
                                            >
                                                <AiOutlineLeft size={24} />
                                            </button>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={handleFlagQuiz}
                                                    className={`bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded ${answeredQuizzes[currentQuizIndex]?.isFlagged ? 'bg-yellow-600' : ''}`}
                                                >
                                                    {answeredQuizzes[currentQuizIndex]?.isFlagged ? <AiFillFlag /> : <AiOutlineFlag />}
                                                </button>
                                                <button
                                                    onClick={handleCheckAnswer}
                                                    disabled={isChecked || selectedAnswer === null}
                                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                                                >
                                                    Check Answer
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleNext}
                                                disabled={currentQuizIndex === quizzes.length - 1}
                                                className="bg-transparent hover:bg-gray-100 hover:bg-opacity-30 text-white font-bold py-2 px-4 rounded-full"
                                            >
                                                <AiOutlineRight size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    {quizzes.length > 0 && (
                        <div className="w-1/4 pl-4">
                            <div className="sticky top-8 p-4 bg-white shadow-lg rounded-lg">
                                <h4 className="font-bold text-center mb-4">Quick Navigation</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {quizzes.map((_, index) => (
                                        <button
                                            key={index}
                                            className={`p-2 rounded-lg text-white ${getButtonClass(index)}`}
                                            onClick={() => jumpToQuiz(index)}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default QuizGenerator;
