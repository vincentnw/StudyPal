import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import fileDownload from 'js-file-download';
import { useLocation } from 'react-router-dom';
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';
import Sidebar from '../components/Sidebar';
import UploadFile from '../components/UploadFile';
import { Document, Packer, Paragraph, TextRun } from "docx";

const NoteGenerator = () => {
    const [file, setFile] = useState(null);
    const [generatedNotes, setGeneratedNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const notesRef = useRef(null);

    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    const saveToSessionStorage = () => {
        sessionStorage.setItem('generatedNotes', generatedNotes);
        sessionStorage.setItem('progress', progress.toString());
    };

    const loadFromSessionStorage = () => {
        const storedNotes = sessionStorage.getItem('generatedNotes');
        const storedProgress = sessionStorage.getItem('progress');

        if (storedNotes) {
            setGeneratedNotes(storedNotes);
        }
        if (storedProgress) {
            setProgress(parseInt(storedProgress, 10));
        }
    };

    useEffect(() => {
        if (generatedNotes) {
            saveToSessionStorage();
        }
    }, [generatedNotes, progress]);

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
            const response = await fetch(process.env.REACT_APP_API_NOTES, {
                method: 'POST',
                body: formData,
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let partialData = '';

            let generatedNotes = '';
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
                                if (parsedChunk.notes) {
                                    generatedNotes += parsedChunk.notes;
                                }
                            } catch (err) {
                                console.error('Failed to parse chunk:', err);
                            }
                        }
                    });
                }
            }
            setGeneratedNotes(formatNotes(generatedNotes));
        } catch (err) {
            setError('Failed to generate notes, please try again.');
            console.error('Error fetching notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatNotes = (notes) => {
        return notes
            .replace(/[#*]+/g, '')
            .replace(/(Chapter \d+|Section \d+|Introduction|Conclusion)/g, '<h2>$1</h2>')
            .replace(/- (.+)/g, '<ul><li>$1</li></ul>')
            .replace(/\n\n+/g, '<p>')
            .replace(/\n/g, '<br/>');
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const content = notesRef.current.getEditor().getText();
        doc.text(content, 10, 10);
        doc.save('generated_notes.pdf');
    };

    const handleExportWord = () => {
        const content = notesRef.current.getEditor().getText();
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: content.split("\n").map(line => new Paragraph({
                        children: [new TextRun(line)]
                    }))
                }
            ]
        });

        Packer.toBlob(doc).then(blob => {
            fileDownload(blob, "generated_notes.docx");
        });
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
                    context="Notes"
                />


                {loading && (
                    <div className="bg-white p-4 rounded-lg shadow-md max-w-lg mb-8 mx-auto">
                        <p className="text-center font-bold mb-2">Generating Notes... {progress}%</p>
                        <div className="w-full bg-gray-300 rounded-full h-4">
                            <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {generatedNotes && (
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-lg shadow-md">
                        <h3 className="text-xl text-white font-bold mb-4">Generated Notes</h3>
                        <div className="h-[500px] w-[100%] overflow-y-scroll bg-gray-50 p-4 rounded-lg shadow-md">
                            <ReactQuill
                                ref={notesRef}
                                theme="snow"
                                value={generatedNotes}
                                onChange={setGeneratedNotes}
                                className="h-full"
                            />
                        </div>

                        <div className="mt-4 flex space-x-4">
                            <button
                                className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 flex items-center"
                                onClick={handleExportPDF}
                            >
                                Export as PDF
                            </button>
                            <button
                                className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 flex items-center"
                                onClick={handleExportWord}
                            >
                                Export as Word
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default NoteGenerator;
