import React, { useEffect, useState } from 'react';

// Helper function to shuffle an array
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const Quiz = ({ question, choices, correctAnswer, selectedAnswer, setSelectedAnswer, isChecked }) => {
    const [shuffledChoices, setShuffledChoices] = useState([]);

    useEffect(() => {
        // Ensure correct answer is not duplicated
        let uniqueChoices = choices;
        if (!choices.includes(correctAnswer)) {
            uniqueChoices = [...choices, correctAnswer]; // Add correct answer if not present
        }

        // Shuffle choices
        const shuffled = shuffleArray(uniqueChoices);
        setShuffledChoices(shuffled);
    }, [question, choices, correctAnswer]);

    // Function to determine if a choice should be highlighted based on the user's selection and the correct answer
    const getChoiceClass = (choice) => {
        if (!isChecked) {
            // When the answer is not checked, highlight the selected choice in blue and allow hover effect
            return selectedAnswer === choice ? 'bg-blue-300' : 'bg-gray-100 hover:bg-blue-100';
        }

        if (selectedAnswer === choice) {
            if (selectedAnswer === correctAnswer) {
                // Highlight the selected answer as green if it's correct
                return 'bg-green-300';
            } else {
                // Highlight the selected answer as red if it's wrong
                return 'bg-red-300';
            }
        }

        // Highlight the correct answer as green if the user chose the wrong answer
        if (choice === correctAnswer) {
            return 'bg-green-300';
        }

        return 'bg-gray-100';
    };

    return (
        <div className="quiz-container">
            <h4 className="font-semibold text-lg mb-4">{question}</h4>
            <ul className="space-y-2">
                {shuffledChoices.map((choice, index) => (
                    <li
                        key={index}
                        className={`p-3 rounded-md cursor-pointer transition-colors duration-200 ${getChoiceClass(choice)}`}
                        onClick={() => !isChecked && setSelectedAnswer(choice)}
                    >
                        <span className="font-semibold">{String.fromCharCode(65 + index)}. </span> {choice}
                    </li>
                ))}
            </ul>
            {/* Only show correct answer text if the user is wrong */}
            {isChecked && selectedAnswer !== correctAnswer && (
                <div className="mt-4 text-gray-700">
                    <strong>Correct Answer: </strong>
                    {correctAnswer}
                </div>
            )}
        </div>
    );
};

export default Quiz;
