import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const TutorialCompleteModal: React.FC = () => {
    const { completeTutorialAndStartGame } = useGameStore();

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            color: 'white'
        }}>
            <h1 style={{
                fontSize: '2.5rem',
                color: '#00ffcc',
                marginBottom: '40px',
                textShadow: '0 0 10px rgba(0,255,204,0.5)'
            }}>
                튜토리얼 완료
            </h1>

            <p style={{ fontSize: '1.2rem', marginBottom: '40px', color: '#ccc' }}>
                이제 본격적인 게임을 시작합니다.
            </p>

            <button
                onClick={completeTutorialAndStartGame}
                style={{
                    padding: '15px 40px',
                    fontSize: '1.5rem',
                    backgroundColor: '#ffd700',
                    color: 'black',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                }}
            >
                게임 시작
            </button>
        </div>
    );
};
