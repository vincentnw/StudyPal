const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const OpenAI = require("openai");
const { Pinecone } = require('@pinecone-database/pinecone');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
};
app.use(cors(corsOptions));
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});
const index = pc.index(process.env.PINECONE_INDEX_NAME);

const upload = multer({ dest: 'uploads/' });

const extractTextFromFile = (filePath, mimetype) => {
    return new Promise(async (resolve, reject) => {
        if (mimetype === 'application/pdf') {
            const fileBuffer = await fs.readFile(filePath);
            pdfParse(fileBuffer).then((data) => resolve(data.text)).catch(reject);
        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            mammoth.extractRawText({ path: filePath })
                .then(result => resolve(result.value))
                .catch(err => reject(new Error('Failed to extract text from DOCX file')));
        } else if (mimetype === 'application/msword') {
            textract.fromFileWithPath(filePath, (err, text) => {
                if (err) {
                    return reject(new Error('Failed to extract text from DOC file.'));
                }
                resolve(text);
            });
        } else if (mimetype === 'text/plain') {
            try {
                const text = await fs.readFile(filePath, 'utf8');
                resolve(text);
            } catch (err) {
                reject(new Error('Failed to read TXT file.'));
            }
        } else {
            reject(new Error('Unsupported file type'));
        }
    });
};

const generateEmbeddings = async (textChunks) => {
    const embeddings = [];
    for (const chunk of textChunks) {
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: chunk,
        });
        embeddings.push({
            text: chunk,
            embedding: embeddingResponse.data[0].embedding
        });
    }
    return embeddings;
};

const storeEmbeddingsInPinecone = async (embeddings) => {
    const vectors = embeddings.map((item, index) => ({
        id: `chunk-${index}`,
        values: item.embedding,
        metadata: { text: item.text }
    }));
    await index.namespace(process.env.PINECONE_INDEX_NAME).upsert(vectors);
};

const retrieveRelevantChunks = async (queryEmbedding) => {
    const queryResult = await index.query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
    });

    return queryResult.matches.map(match => match.metadata.text);
};

const deleteVectorsFromPinecone = async (vectorIds) => {
    await index.namespace(process.env.PINECONE_INDEX_NAME).deleteMany(vectorIds);
};

//notes endpoint
app.post(process.env.GENERATE_NOTES_API, upload.single('file'), async (req, res) => {
    try {
        console.log('Request received to generate notes.');
        const { file } = req;
        if (!file) {
            console.log('No file uploaded.');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log(`File uploaded: ${file.originalname} with mimetype: ${file.mimetype}`);
        console.log('Extracting text from the file...');
        const text = await extractTextFromFile(file.path, file.mimetype);
        console.log('Text extraction completed.');
        console.log('Splitting text into manageable chunks...');
        const chunkSize = 3000;
        const textChunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            textChunks.push(text.substring(i, i + chunkSize));
        }
        console.log(`Text split into ${textChunks.length} chunks.`);
        console.log('Generating embeddings for text chunks...');
        const embeddings = await generateEmbeddings(textChunks);
        console.log('Storing embeddings in Pinecone...');
        await storeEmbeddingsInPinecone(embeddings);
        let generatedNotes = '';
        const totalChunks = textChunks.length;
        const vectorIds = embeddings.map((_, index) => `chunk-${index}`);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.write(JSON.stringify({ progress: 0 }) + '\n');
        for (const [index, { text: chunk, embedding }] of embeddings.entries()) {
            console.log(`Processing chunk ${index + 1}/${totalChunks} with OpenAI API...`);
            const relatedChunks = await retrieveRelevantChunks(embedding);
            const combinedText = [chunk, ...relatedChunks].join("\n");
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant tasked with summarizing educational material to create useful study notes. Your job is to break down the content into digestible pieces, highlighting key points, important concepts, definitions, and takeaways.' },
                    {
                        role: 'user', content: `Here is a text I need study notes from:
                        ${combinedText}
                        Please summarize the key points, concepts, and takeaways from this text in the form of concise study notes.`
                    }
                ],
                max_tokens: 2000,
                temperature: 1,
            });
            console.log(`Chunk ${index + 1} processed successfully.`);
            generatedNotes += response.choices[0].message.content.trim() + '\n';
            const progress = Math.round(((index + 1) / totalChunks) * 100);
            res.write(JSON.stringify({ progress }) + '\n');
        }
        console.log('All chunks processed successfully.');
        console.log('Cleaning up uploaded file...');
        fs.unlink(file.path);
        console.log('File cleanup complete.');
        res.write(JSON.stringify({ notes: generatedNotes }) + '\n');
        res.end();
        console.log('Deleting vectors from Pinecone...');
        await deleteVectorsFromPinecone(vectorIds);
        console.log('Vectors deleted from Pinecone.');

    } catch (error) {
        console.error("Server error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate notes', details: error.message });
        }
    }
});

//flashcard endpoint
app.post(process.env.GENERATE_FLASHCARDS_API, upload.single('file'), async (req, res) => {
    try {
        console.log('Request received to generate flashcards.');
        const { file } = req;
        if (!file) {
            console.log('No file uploaded.');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log(`File uploaded: ${file.originalname}`);
        console.log('Extracting text from the file...');
        const text = await extractTextFromFile(file.path, file.mimetype);
        console.log('Text extraction completed.');
        console.log('Splitting text into manageable chunks...');
        const chunkSize = 3000;
        const textChunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            textChunks.push(text.substring(i, i + chunkSize));
        }
        console.log(`Text split into ${textChunks.length} chunks.`);
        console.log('Generating embeddings for text chunks...');
        const embeddings = await generateEmbeddings(textChunks);
        console.log('Storing embeddings in Pinecone...');
        await storeEmbeddingsInPinecone(embeddings);
        let generatedFlashcards = [];
        const totalChunks = textChunks.length;
        const vectorIds = embeddings.map((_, index) => `chunk-${index}`);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.write(JSON.stringify({ progress: 0 }) + '\n');
        for (const [index, { text: chunk, embedding }] of embeddings.entries()) {
            console.log(`Processing chunk ${index + 1}/${totalChunks} with OpenAI API...`);
            const relatedChunks = await retrieveRelevantChunks(embedding);
            const combinedText = [chunk, ...relatedChunks].join("\n");
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant tasked with creating flashcards from educational material. Each flashcard should have a question and an answer, focusing on key concepts, definitions, and important takeaways.' },
                    {
                        role: 'user', content: `Here is a text I need flashcards from:
                        ${combinedText}
                        Please generate flashcards from this text. Each flashcard should have a question and an answer.`
                    }
                ],
                max_tokens: 2000,
                temperature: 1,
            });
            console.log(`Chunk ${index + 1} processed successfully.`);
            const flashcardsText = response.choices[0].message.content.trim();
            const flashcards = flashcardsText.split('\n').filter(line => line);
            generatedFlashcards.push(...flashcards);
            const progress = Math.round(((index + 1) / totalChunks) * 100);
            res.write(JSON.stringify({ progress }) + '\n');
        }
        console.log('All chunks processed successfully.');
        console.log('Cleaning up uploaded file...');
        fs.unlink(file.path);
        console.log('File cleanup complete.');
        res.write(JSON.stringify({ flashcards: generatedFlashcards }) + '\n');
        res.end();
        console.log('Deleting vectors from Pinecone...');
        await deleteVectorsFromPinecone(vectorIds);
        console.log('Vectors deleted from Pinecone.');
    } catch (error) {
        console.error("Server error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate flashcards', details: error.message });
        }
    }
});

//quiz endpoint
app.post(process.env.GENERATE_QUIZ_API, upload.single('file'), async (req, res) => {
    try {
        console.log('Request received to generate quizzes.');
        const { file } = req;
        if (!file) {
            console.log('No file uploaded.');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log(`File uploaded: ${file.originalname}`);
        console.log('Extracting text from the file...');
        const text = await extractTextFromFile(file.path, file.mimetype);
        console.log('Text extraction completed.');
        console.log('Splitting text into manageable chunks...');
        const chunkSize = 5000;
        const textChunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            textChunks.push(text.substring(i, i + chunkSize));
        }
        console.log(`Text split into ${textChunks.length} chunks.`);
        console.log('Generating embeddings for text chunks...');
        const embeddings = await generateEmbeddings(textChunks);
        console.log('Storing embeddings in Pinecone...');
        await storeEmbeddingsInPinecone(embeddings);
        let generatedQuizzes = [];
        const totalChunks = textChunks.length;
        const vectorIds = embeddings.map((_, index) => `chunk-${index}`);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.write(JSON.stringify({ progress: 0 }) + '\n');
        for (const [index, { text: chunk, embedding }] of embeddings.entries()) {
            console.log(`Processing chunk ${index + 1}/${totalChunks} with OpenAI API...`);
            const relatedChunks = await retrieveRelevantChunks(embedding);
            const combinedText = [chunk, ...relatedChunks].join("\n");
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant tasked with creating quiz questions. Respond ONLY in JSON format.' },
                    {
                        role: 'user', content: `Here is a text I need quiz questions from:
                        ${combinedText}
                        Generate quiz questions in the following JSON format without any explanation:
                        { "question": "Question text", "choices": ["Choice A", "Choice B", "Choice C", "Choice D"], "correctAnswer": "Correct Answer" }`
                    }
                ],
                max_tokens: 2000,
                temperature: 1,
            });
            console.log(`Chunk ${index + 1} processed successfully.`);
            let quizData;
            try {
                const cleanedResponse = response.choices[0].message.content.trim()
                    .replace(/```json/g, '')
                    .replace(/```/g, '');
                quizData = JSON.parse(cleanedResponse);
            } catch (err) {
                console.error('Failed to parse OpenAI response as JSON:', err);
                continue;
            }
            generatedQuizzes.push(...quizData);
            const progress = Math.round(((index + 1) / totalChunks) * 100);
            res.write(JSON.stringify({ progress }) + '\n');
        }
        console.log('All chunks processed successfully.');
        console.log('Cleaning up uploaded file...');
        fs.unlink(file.path);
        console.log('File cleanup complete.');
        console.log('Generated Quizzes:', generatedQuizzes);
        res.write(JSON.stringify({ quizzes: generatedQuizzes }) + '\n');
        res.end();
        console.log('Deleting vectors from Pinecone...');
        await deleteVectorsFromPinecone(vectorIds);
        console.log('Vectors deleted from Pinecone.');
    } catch (error) {
        console.error("Server error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate quizzes', details: error.message });
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running!`);
});
