import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface FlashOverlayProps {
    playerHp: number;
}

export const FlashOverlay: React.FC<FlashOverlayProps> = ({ playerHp }) => {
    const controls = useAnimation();
    const prevHp = useRef(playerHp);

    useEffect(() => {
        if (playerHp < prevHp.current) {
            // Damage Taken
            controls.start({
                opacity: [0, 0.3, 0],
                transition: { duration: 0.3 }
            });
        }
        prevHp.current = playerHp;
    }, [playerHp, controls]);

    return (
        <motion.div
            animate={controls}
            initial={{ opacity: 0 }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'red',
                zIndex: 999, // Very high to cover everything
                pointerEvents: 'none'
            }}
        />
    );
};
