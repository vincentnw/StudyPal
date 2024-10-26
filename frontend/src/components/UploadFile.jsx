import React, { useState, useEffect } from 'react';
import { AiOutlineCloudUpload } from 'react-icons/ai';
import { useLocation } from 'react-router-dom';

const UploadFile = ({ handleFileChange, handleSubmit, loading, context }) => {
    const contextText = context || 'Notes';
    const location = useLocation();

    const [fileName, setFileName] = useState(null);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const supportedFileTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
    ];

    const storeFileInLocalStorage = (file) => {
        const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
        };
        localStorage.setItem('uploadedFile', JSON.stringify(fileData));
    };

    useEffect(() => {
        const storedFile = localStorage.getItem('uploadedFile');
        if (storedFile) {
            setFileName(JSON.parse(storedFile).name);
        }
    }, []);

    useEffect(() => {
        if (location.pathname !== '/note-generator') {
            localStorage.removeItem('uploadedFile');
            setFileName(null);
        }
    }, [location.pathname]);

    const handleFileValidation = (file) => {
        if (!supportedFileTypes.includes(file.type)) {
            setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
            return false;
        }
        setError('');
        return true;
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && handleFileValidation(file)) {
            setFileName(file.name);
            storeFileInLocalStorage(file);
            handleFileChange(event);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer?.files[0];
        if (file && handleFileValidation(file)) {
            const fileInputEvent = {
                target: {
                    files: event.dataTransfer.files,
                },
            };
            setFileName(file.name);
            storeFileInLocalStorage(file);
            handleFileChange(fileInputEvent);
        }
    };

    const onSubmitForm = (e) => {
        e.preventDefault();
        if (!fileName) {
            setError('Please upload a file before generating notes.');
            return;
        }
        handleSubmit(e);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mb-8 mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">Upload Study Material</h2>
            <form onSubmit={onSubmitForm} className="text-center">
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 rounded-lg p-6 mb-4 flex flex-col items-center justify-center transition-all 
                        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'}`}
                    style={{ height: '200px' }}
                >
                    {isDragging ? (
                        <p className="text-gray-500">File drop in progress...</p>
                    ) : (
                        <>
                            <AiOutlineCloudUpload className="text-5xl text-gray-400 mb-4" />
                            <p className="text-gray-500 mb-2">Choose a file or drag & drop it here</p>
                            <p className="text-gray-400 text-sm mb-4">
                                Accepted file types: PDF, Word (.docx), and Text (.txt), up to 50MB
                            </p>
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                <span>Browse File</span>
                            </label>
                            <input
                                id="file-upload"
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                accept=".pdf, .docx, .txt"
                            />
                        </>
                    )}
                </div>

                {fileName && (
                    <div className="bg-gray-100 p-2 rounded-md text-left mb-4">
                        <p className="text-gray-800"><strong>Selected file:</strong> {fileName}</p>
                    </div>
                )}

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button
                    type="submit"
                    className={`bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-full hover:bg-gradient-to-l shadow-md flex items-center justify-center w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                >
                    {loading ? `Generating ${contextText}...` : `Generate ${contextText}`}
                </button>
            </form>
        </div>
    );
};

export default UploadFile;
