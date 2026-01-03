
import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const TitleScreen: React.FC = () => {
    const { isTutorialCompleted, setGameMode, setCurrentScene } = useGameStore();

    const handleStart = () => {
        if (isTutorialCompleted) {
            // Continue
            setCurrentScene('worldmap');
            setGameMode('dungeon'); // Or map mode if we had one separate, but dungeon mode for now handles map access logic context
        } else {
            // New Game
            setGameMode('tutorial');
            setCurrentScene('game');
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#111',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200, // Top level
            color: 'white'
        }}>
            <h1 style={{
                fontSize: '4rem',
                marginBottom: '60px',
                color: '#00ffcc',
                textShadow: '0 0 20px rgba(0,255,204,0.5)',
                textAlign: 'center'
            }}>
                DIVIDER
            </h1>

            <button
                onClick={handleStart}
                style={{
                    padding: '14px 40px',
                    fontSize: '1.4rem',
                    backgroundColor: '#00ffcc',
                    color: 'black',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 0 20px #00ffcc',
                    transition: 'transform 0.2s',
                    textTransform: 'uppercase'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {isTutorialCompleted ? 'CONTINUE' : 'START GAME'}
            </button>

            <div style={{
                marginTop: '40px',
                color: '#555',
                fontSize: '0.9rem'
            }}>
                v0.1.0 Prototype
            </div>
        </div>
    );
};
