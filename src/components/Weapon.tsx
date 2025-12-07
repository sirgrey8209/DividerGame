import React from 'react';
import { motion } from 'framer-motion';
import type { WeaponData } from '../store/useGameStore';

interface WeaponProps {
    data: WeaponData;
    onStartDrag: (e: React.PointerEvent, weapon: WeaponData) => void;
    isReady: boolean;
    cooldownProgress?: number; // 0 to 1
    isLocked?: boolean;
    isHighlighted?: boolean;
}

export const Weapon: React.FC<WeaponProps> = ({
    data, onStartDrag, isReady, cooldownProgress = 1,
    isLocked = false, isHighlighted = false
}) => {
    const isCircle = data.shape === 'circle';

    return (
        <motion.div
            onPointerDown={(e) => !isLocked && isReady && onStartDrag(e, data)}
            whileTap={(!isLocked && isReady) ? { scale: 0.9 } : undefined}
            animate={isHighlighted ? {
                scale: [1, 1.1, 1],
                boxShadow: ["0 0 5px #ffd700", "0 0 20px #ffd700", "0 0 5px #ffd700"]
            } : { scale: 1, boxShadow: "0 0 0px transparent" }}
            transition={isHighlighted ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
            style={{
                width: '60px',
                height: '60px',
                position: 'relative',
                borderRadius: isCircle ? '50%' : '12px',
                cursor: isLocked ? 'not-allowed' : 'grab',
                opacity: isLocked ? 0.3 : 1,
                filter: isLocked ? 'grayscale(100%)' : 'none',
                // overflow: visible default allows shadow
                zIndex: isHighlighted ? 100 : 'auto', // Bring to front if highlighted
            }}
        >
            {/* Clipping Container for Content */}
            <div style={{
                width: '100%', height: '100%',
                borderRadius: isCircle ? '50%' : '12px',
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: isReady ? (isCircle ? '#ffd700' : '#4444ff') : '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {/* Cooldown Fill */}
                {!isReady && (
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: `${cooldownProgress * 100}%`,
                        backgroundColor: isCircle ? '#ffd700' : '#4444ff',
                        opacity: 0.5,
                        zIndex: 0
                    }} />
                )}

                {/* Text Label */}
                <div style={{
                    zIndex: 1,
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: isReady ? (isCircle ? 'black' : 'white') : '#888'
                }}>
                    {data.damage}
                </div>
            </div>

            {/* Highlight Border (Optional extra punch) */}
            {isHighlighted && (
                <div style={{
                    position: 'absolute',
                    inset: -3,
                    borderRadius: isCircle ? '50%' : '14px',
                    border: '2px solid #fff',
                    pointerEvents: 'none',
                    zIndex: 2
                }} />
            )}
        </motion.div>
    );
};
