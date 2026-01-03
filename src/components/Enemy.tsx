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

export const Enemy = forwardRef<EnemyHandle, EnemyProps>(({ hp, maxHp, attackTimer = 0, lastAttackTime = 0, maxAttackTimer = 5000, isBoss }, ref) => {
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

    // Size based on Boss status
    const size = isBoss ? 120 : 80;

    // Path scaling for gauge (Original 80x80 logic needs adjusting if we want perfect gauge on big boss)
    // For simplicity, we'll scale the SVG container or keep gauge relative.
    // Actually, distinct gauge path calculation for boss size would be better, but scaling works for prototype.
    // Let's just scale the whole element.

    // Right Half Path (80x80 basis)
    const rightPath = `M 40 0 L 68 0 Q 80 0 80 12 L 80 68 Q 80 80 68 80 L 40 80`;
    // Left Half Path
    const leftPath = `M 40 0 L 12 0 Q 0 0 0 12 L 0 68 Q 0 80 12 80 L 40 80`;
    const pathLen = 150;

    return (
        <motion.div
            ref={elRef}
            animate={controls}
            initial={{ scale: 0, opacity: 0 }}
            exit={isBoss ? {
                scale: [1, 1.2, 0.1, 0],
                opacity: [1, 1, 1, 0],
                rotate: [0, 10, -10, 180],
                filter: ['brightness(1)', 'brightness(3)', 'hue-rotate(90deg)', 'brightness(0)'],
                transition: { duration: 2.5, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }
            } : {
                scale: [1, 1.2, 0],
                opacity: [1, 1, 0],
                transition: { duration: 0.5 }
            }}
            style={{
                width: size,
                height: size,
                backgroundColor: isBoss ? '#800080' : '#ff4444', // Boss = Purple, Normal = Red
                margin: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                borderRadius: '12px',
                position: 'relative',
                boxShadow: isBoss ? '0 0 15px #b026ff' : '0 4px 6px rgba(0,0,0,0.3)',
                border: isBoss ? '3px solid #ff00ff' : 'none'
            }}
        >
            {isBoss && (
                <div style={{
                    position: 'absolute', top: -30,
                    color: '#ff00ff', fontWeight: 'bold',
                    textShadow: '0 0 5px #ff00ff'
                }}>
                    BOSS
                </div>
            )}

            {/* Attack Gauge - NEON PURPLE (Scaled via SVG viewbox if needed, or just stretched if 100%) */}
            {maxAttackTimer > 0 && (
                <svg viewBox="0 0 80 80" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                    <path d={rightPath} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />
                    <path d={leftPath} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />

                    <motion.path
                        d={rightPath}
                        fill="none"
                        stroke={isBoss ? "#ff0000" : "#b026ff"}
                        strokeWidth="4"
                        strokeDasharray={pathLen}
                        strokeDashoffset={pathLen - (pathLen * progress)}
                        style={{
                            transition: 'stroke-dashoffset 0.1s linear',
                            filter: 'drop-shadow(0 0 2px #fff)'
                        }}
                    />
                    <motion.path
                        d={leftPath}
                        fill="none"
                        stroke={isBoss ? "#ff0000" : "#b026ff"}
                        strokeWidth="4"
                        strokeDasharray={pathLen}
                        strokeDashoffset={pathLen - (pathLen * progress)}
                        style={{
                            transition: 'stroke-dashoffset 0.1s linear',
                            filter: 'drop-shadow(0 0 2px #fff)'
                        }}
                    />
                </svg>
            )}

            <div style={{ fontSize: isBoss ? '2rem' : '1.5rem', fontWeight: 'bold', color: 'white', zIndex: 2, textShadow: '0 2px 2px rgba(0,0,0,0.5)' }}>
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
