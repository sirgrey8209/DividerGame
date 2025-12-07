import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

export interface PlayerHandle {
    animateAttack: () => void;
}

interface PlayerProps {
    hp: number;
    maxHp: number;
}

export const Player = forwardRef<PlayerHandle, PlayerProps>(({ hp, maxHp }, ref) => {
    const controls = useAnimation();

    useImperativeHandle(ref, () => ({
        animateAttack: () => {
            controls.start({
                y: [0, -40, 0],
                scale: [1, 1.1, 1],
                transition: { duration: 0.2, ease: "easeOut" }
            });
        }
    }));

    useEffect(() => {
        // Trigger shake if HP changes (assuming mostly damage)
        if (hp < maxHp) {
            controls.start({
                x: [0, -5, 5, -5, 5, 0],
                filter: ['brightness(1)', 'brightness(2) saturate(200%)', 'brightness(1)'],
                transition: { duration: 0.4, type: 'tween', ease: 'easeInOut' }
            });
        }
    }, [hp, maxHp, controls]);

    return (
        <motion.div
            animate={controls}
            title={`HP: ${hp}/${maxHp}`}
            style={{
                width: '80px', // Matches Enemy 80px
                height: '80px',
                backgroundColor: '#00ffcc',
                border: '4px solid #fff',
                boxShadow: '0 0 20px #00ffcc',
                borderRadius: '12px',
                position: 'relative',
                zIndex: 10
                // Centering handled by parent in App.tsx
            }}
        >
            {/* No text content inside */}
        </motion.div>
    );
});
