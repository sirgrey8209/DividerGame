
import React from 'react';
import { motion } from 'framer-motion';

interface DungeonNodeProps {
    id: number;
    x: number;
    y: number;
    status: 'locked' | 'unlocked' | 'cleared';
    onClick: () => void;
}

export const DungeonNode: React.FC<DungeonNodeProps> = ({ id, x, y, status, onClick }) => {
    const isLocked = status === 'locked';

    return (
        <div
            onClick={!isLocked ? onClick : undefined}
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            <motion.div
                initial={false}
                animate={{
                    scale: status === 'unlocked' ? [1, 1.1, 1] : 1,
                    boxShadow: status === 'unlocked'
                        ? '0 0 15px rgba(0, 255, 204, 0.6)'
                        : '0 0 0px rgba(0, 0, 0, 0)'
                }}
                transition={{
                    scale: { duration: 2, repeat: Infinity },
                    boxShadow: { duration: 2, repeat: Infinity }
                }}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: isLocked ? '#333' : (status === 'cleared' ? '#00cc88' : '#00ffcc'),
                    border: `3px solid ${isLocked ? '#555' : 'white'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: isLocked ? '#777' : 'black',
                    position: 'relative'
                }}
            >
                {/* Lock Icon or Number */}
                {isLocked ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                ) : (
                    id
                )}
            </motion.div>

            <div style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '4px 8px',
                borderRadius: '4px',
                color: isLocked ? '#777' : 'white',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap'
            }}>
                Dungeon {id}
            </div>
        </div>
    );
};
