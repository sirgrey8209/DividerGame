
import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import dungeonData from '../../data/dungeonData.json';
import { DungeonNode } from './DungeonNode';

export const WorldMap: React.FC = () => {
    const { maxUnlockedDungeonId, selectDungeon, setMenuOpen } = useGameStore();
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest unlocked dungeon
    useEffect(() => {
        if (containerRef.current) {
            const targetDungeon = dungeonData.find(d => d.id === maxUnlockedDungeonId);
            if (targetDungeon) {
                // Determine scroll position: Center the target node
                const containerHeight = containerRef.current.clientHeight;
                const scrollY = targetDungeon.y - (containerHeight / 2);
                containerRef.current.scrollTo({ top: scrollY, behavior: 'smooth' });
            }
        }
    }, [maxUnlockedDungeonId]);

    const getStatus = (id: number) => {
        if (id < maxUnlockedDungeonId) return 'cleared';
        if (id === maxUnlockedDungeonId) return 'unlocked';
        return 'locked';
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#111',
            zIndex: 50,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)',
                zIndex: 60
            }}>
                <button
                    onClick={() => setMenuOpen(true)}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                    </svg>
                </button>
                <h1 style={{ color: 'white', fontSize: '1.5rem', margin: 0 }}>WORLD MAP</h1>
                <div style={{ width: 24 }}></div>
            </div>

            {/* Map Container */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    position: 'relative',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    // Add padding to bottom to allow scrolling past last item
                    paddingBottom: '200px'
                }}
            >
                {/* SVG Lines Layer */}
                <svg
                    viewBox={`0 0 100 ${Math.max(...dungeonData.map(d => d.y)) + 200}`}
                    preserveAspectRatio="none"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: Math.max(...dungeonData.map(d => d.y)) + 200, // Ensure SVG covers all nodes
                        pointerEvents: 'none'
                    }}>
                    {dungeonData.map((dungeon, index) => {
                        if (index === dungeonData.length - 1) return null;
                        const next = dungeonData[index + 1];

                        // Control Points for Bezier Curve (S-shape)
                        const cp1y = dungeon.y + (next.y - dungeon.y) * 0.5;
                        const cp2y = dungeon.y + (next.y - dungeon.y) * 0.5;

                        // Status of the path (unlocked if NEXT node is unlocked or current is cleared)
                        const isUnlocked = next.id <= maxUnlockedDungeonId;

                        return (
                            <path
                                key={`path-${dungeon.id}`}
                                d={`M ${dungeon.x} ${dungeon.y} C ${dungeon.x} ${cp1y}, ${next.x} ${cp2y}, ${next.x} ${next.y}`}
                                vectorEffect="non-scaling-stroke"
                                stroke={isUnlocked ? "#00ffcc" : "#333"}
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={isUnlocked ? "none" : "10,10"}
                                style={{
                                    transition: 'stroke 0.5s',
                                    opacity: 0.6
                                }}
                            />
                        );
                    })}
                </svg>

                {/* Nodes Layer */}
                {dungeonData.map(dungeon => (
                    <DungeonNode
                        key={dungeon.id}
                        id={dungeon.id}
                        x={dungeon.x}
                        y={dungeon.y}
                        status={getStatus(dungeon.id)}
                        onClick={() => selectDungeon(dungeon.id)}
                    />
                ))}
            </div>
        </div>
    );
};
