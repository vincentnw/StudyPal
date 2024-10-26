import React, { useEffect, useState } from 'react';

const Flashcard = ({ question, answer, isFlipped, setIsFlipped, flipDirection }) => {
    const [cardFlipClass, setCardFlipClass] = useState('');

    useEffect(() => {
        if (flipDirection === 'right') {
            setCardFlipClass('rotate-y-right');
        } else if (flipDirection === 'left') {
            setCardFlipClass('rotate-y-left');
        }

        const timer = setTimeout(() => {
            setCardFlipClass('');
        }, 700);

        return () => clearTimeout(timer);
    }, [flipDirection]);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div
            className={`perspective-1000 w-full h-[400px] md:h-[500px] max-w-4xl mx-auto cursor-pointer transition-transform duration-700 ${cardFlipClass}`}
            onClick={handleFlip}
        >
            <div
                className={`relative w-full h-full bg-white shadow-xl rounded-lg text-center transform transition-transform duration-700 ${isFlipped ? 'rotate-x-180' : ''
                    }`}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div
                    className="absolute w-full h-full flex flex-col justify-center items-center backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <h4 className="text-3xl font-bold mb-4">Question</h4>
                    <p className="text-xl px-8">{question}</p>
                </div>

                <div
                    className="absolute w-full h-full flex flex-col justify-center items-center backface-hidden"
                    style={{ transform: 'rotateX(180deg)', backfaceVisibility: 'hidden' }}
                >
                    <h4 className="text-3xl font-bold mb-4">Answer</h4>
                    <p className="text-xl px-8">{answer}</p>
                </div>
            </div>
        </div>
    );
};

export default Flashcard;
