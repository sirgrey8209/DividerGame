import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { EnemyData } from '../store/useGameStore';

export interface EnemyHandle {
    animateSuccess: () => void;
    animateFailure: () => void;
    domNode: HTMLDivElement | null;
}

interface EnemyProps extends EnemyData {
    registerRef?: (id: string, element: any) => void;
    maxAttackTimer?: number;
}

export const Enemy = forwardRef<EnemyHandle, EnemyProps>(({ hp, maxHp, attackTimer = 0, lastAttackTime = 0, maxAttackTimer = 5000 }, ref) => {
    const elRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();

    useImperativeHandle(ref, () => ({
        animateSuccess: () => {
            controls.start({
                scale: [1, 1.2, 1],
                filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'],
                transition: { duration: 0.3 }
            });
        },
        animateFailure: () => {
            controls.start({
                x: [0, -5, 5, -5, 5, 0],
                transition: { duration: 0.3 }
            });
        },
        domNode: elRef.current
    }));

    // Enter Animation
    useEffect(() => {
        controls.start({
            scale: 1,
            opacity: 1,
            transition: { duration: 0.3 }
        });
    }, [controls]);

    // Attack Animation (Lunge)
    useEffect(() => {
        if (lastAttackTime > 0) {
            controls.start({
                scale: [1, 1.4, 1],
                rotate: [0, -5, 5, 0],
                transition: { duration: 0.3, type: 'tween', ease: 'easeInOut' }
            });
        }
    }, [lastAttackTime, controls]);

    // Calculate progress (0 to 1)
    const progress = Math.min(1, attackTimer / maxAttackTimer);

    // Half-perimeter path approx.
    const pathLen = 150;

    // Right Half Path
    const rightPath = `M 40 0 L 68 0 Q 80 0 80 12 L 80 68 Q 80 80 68 80 L 40 80`;

    // Left Half Path
    const leftPath = `M 40 0 L 12 0 Q 0 0 0 12 L 0 68 Q 0 80 12 80 L 40 80`;

    return (
        <motion.div
            ref={elRef}
            animate={controls}
            initial={{ scale: 0, opacity: 0 }}
            exit={{
                scale: [1, 1.5, 0],
                rotate: [0, 0, 180],
                opacity: [1, 1, 0],
                transition: { duration: 0.5, times: [0, 0.3, 1] }
            }}
            style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#ff4444',
                margin: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                borderRadius: '12px',
                position: 'relative',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            }}
        >
            {/* Attack Gauge - NEON PURPLE */}
            {maxAttackTimer > 0 && (
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                    <path d={rightPath} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />
                    <path d={leftPath} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />

                    <motion.path
                        d={rightPath}
                        fill="none"
                        stroke="#b026ff"
                        strokeWidth="4"
                        strokeDasharray={pathLen}
                        strokeDashoffset={pathLen - (pathLen * progress)}
                        style={{
                            transition: 'stroke-dashoffset 0.1s linear',
                            filter: 'drop-shadow(0 0 2px #b026ff) drop-shadow(0 0 5px #b026ff)'
                        }}
                    />
                    <motion.path
                        d={leftPath}
                        fill="none"
                        stroke="#b026ff"
                        strokeWidth="4"
                        strokeDasharray={pathLen}
                        strokeDashoffset={pathLen - (pathLen * progress)}
                        style={{
                            transition: 'stroke-dashoffset 0.1s linear',
                            filter: 'drop-shadow(0 0 2px #b026ff) drop-shadow(0 0 5px #b026ff)'
                        }}
                    />
                </svg>
            )}

            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', zIndex: 2, textShadow: '0 2px 2px rgba(0,0,0,0.5)' }}>
                {hp}
            </div>

            <div style={{
                width: '60%',
                height: '4px',
                background: 'rgba(0,0,0,0.3)',
                marginTop: '4px',
                borderRadius: '2px',
                zIndex: 2
            }}>
                <motion.div
                    animate={{ width: `${(hp / maxHp) * 100}%` }}
                    style={{ height: '100%', background: 'white', borderRadius: '2px' }}
                />
            </div>
        </motion.div>
    );
});
