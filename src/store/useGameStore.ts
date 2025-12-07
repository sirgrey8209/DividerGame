import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import gameData from '../data/gameData.json';
import tutorialData from '../data/tutorialData.json';

export interface EnemyData {
    id: string;
    hp: number;
    maxHp: number;
    x: number;
    y: number;
    attackTimer: number; // ms accumulated
    lastAttackTime: number; // Timestamp of last attack
    damage: number;
    attackInterval?: number; // Override for attack interval (if negative, attack is disabled)
}

export interface WeaponData {
    id: string;
    damage: number;
    shape: 'circle' | 'square';
    label: string;
    cooldown: number; // ms
}

interface GameState {
    enemies: EnemyData[];
    score: number;
    weaponCooldowns: Record<string, number>;

    playerHp: number;
    maxPlayerHp: number;
    isGameOver: boolean;
    waveSize: number;

    isMenuOpen: boolean;
    gameMode: 'title' | 'normal' | 'tutorial';
    tutorialStep: number;
    tutorialProgress: number; // Granular step for guided tutorial (10-30)
    isTutorialCompleted: boolean;
    lockedWeaponIds: string[];
    highlightedWeaponIds: string[];
    isTimerPaused: boolean;
    isInvincible: boolean; // Prevent death during critical lessons
    sessionId: number; // Used to force remount of components (like AnimatePresence) on clear

    spawnEnemies: () => void;
    damageEnemy: (id: string, weapon: WeaponData) => boolean;
    triggerCooldown: (id: string, duration?: number) => void;

    gameTick: (deltaTime: number) => void;
    restartGame: () => void;
    setMenuOpen: (isOpen: boolean) => void;
    setGameMode: (mode: 'title' | 'normal' | 'tutorial') => void;
    completeTutorialAndStartGame: () => void;
    advanceTutorial: (progress?: number) => void;
}

export const WEAPONS: WeaponData[] = [
    { id: 'w_basic', damage: 1, shape: 'circle', label: '1', cooldown: 1000 },
    { id: 'w_2', damage: 2, shape: 'square', label: '2', cooldown: 3000 },
    { id: 'w_3', damage: 3, shape: 'square', label: '3', cooldown: 3000 },
    { id: 'w_5', damage: 5, shape: 'square', label: '5', cooldown: 3000 },
    { id: 'w_7', damage: 7, shape: 'square', label: '7', cooldown: 3000 },
];

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            enemies: [],
            score: 0,
            weaponCooldowns: {},
            playerHp: 5,
            maxPlayerHp: 5,
            isGameOver: false,
            waveSize: 0,
            isMenuOpen: false,
            gameMode: 'normal', // 'normal' | 'tutorial'
            tutorialStep: 0,
            tutorialProgress: 0,
            isTutorialCompleted: false,
            lockedWeaponIds: [],
            highlightedWeaponIds: [],
            isTimerPaused: false,
            isInvincible: false,
            sessionId: 0,

            setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),

            setGameMode: (mode) => {
                set({
                    gameMode: mode,
                    tutorialStep: mode === 'tutorial' ? 1 : 0,
                    tutorialProgress: mode === 'tutorial' ? 10 : 0, // Start at 10 for guided flow
                    isTutorialCompleted: mode === 'tutorial' ? false : get().isTutorialCompleted,
                    lockedWeaponIds: [],
                    highlightedWeaponIds: [],
                    isTimerPaused: false,
                    isInvincible: false
                });
                get().restartGame();
            },

            completeTutorialAndStartGame: () => {
                set({
                    isTutorialCompleted: true,
                    gameMode: 'normal',
                    tutorialStep: 0,
                    tutorialProgress: 0,
                    isMenuOpen: false,
                    isGameOver: false,
                    isTimerPaused: false,
                    isInvincible: false,
                    lockedWeaponIds: [],
                    highlightedWeaponIds: []
                });
                get().restartGame();
            },

            advanceTutorial: (progress) => {
                set(state => ({
                    tutorialProgress: progress !== undefined ? progress : state.tutorialProgress + 1
                }));
            },

            spawnEnemies: () => {
                const { gameMode, tutorialStep } = get();
                const newEnemies: EnemyData[] = [];

                if (gameMode === 'tutorial') {
                    if (tutorialStep === 1) {
                        // Tutorial Phase 1
                        const data = (tutorialData as any).phases["1"][0];
                        newEnemies.push({
                            id: crypto.randomUUID(),
                            hp: data.hp,
                            maxHp: data.maxHp,
                            x: 0,
                            y: 0,
                            attackTimer: 0,
                            lastAttackTime: 0,
                            damage: data.damage,
                            attackInterval: data.attackInterval
                        });
                        set({ waveSize: 1 });
                    } else if (tutorialStep === 2) {
                        // Tutorial Phase 2
                        (tutorialData as any).phases["2"].forEach((d: any) => {
                            newEnemies.push({
                                id: crypto.randomUUID(),
                                hp: d.hp,
                                maxHp: d.maxHp,
                                x: 0,
                                y: 0,
                                attackTimer: 0,
                                lastAttackTime: 0,
                                damage: d.damage,
                                attackInterval: d.attackInterval
                            });
                        });
                        set({ waveSize: (tutorialData as any).phases["2"].length });
                    }
                } else {
                    // Normal Mode
                    const { enemyCountMin, enemyCountMax, hpMin, hpMax, damage } = gameData.normal;
                    const count = Math.floor(Math.random() * (enemyCountMax - enemyCountMin + 1)) + enemyCountMin;
                    for (let i = 0; i < count; i++) {
                        const hp = Math.floor(Math.random() * (hpMax - hpMin)) + hpMin;
                        newEnemies.push({
                            id: crypto.randomUUID(),
                            hp,
                            maxHp: hp,
                            x: 0,
                            y: 0,
                            attackTimer: 0,
                            lastAttackTime: 0,
                            damage: damage
                        });
                    }
                    set({ waveSize: count });
                }

                set({ enemies: newEnemies });
            },

            triggerCooldown: (id, duration = 3000) => {
                const now = Date.now();
                set((state) => ({
                    weaponCooldowns: {
                        ...state.weaponCooldowns,
                        [id]: now + duration
                    }
                }));
            },

            damageEnemy: (id, weapon) => {
                let success = false;
                let triggerNext = false;
                let nextStepVal: number | undefined = undefined;
                let delayVal = 0;

                set((state) => {
                    if (state.isGameOver) return state;

                    const updatedEnemies = state.enemies.map(e => {
                        if (e.id === id) {
                            let newHp = e.hp;
                            let newTimer = e.attackTimer;

                            if (weapon.label === '1') {
                                newHp = e.hp - 1;
                                newTimer = Math.max(0, e.attackTimer - 1000);
                                success = true;
                            } else if (e.hp % weapon.damage === 0) {
                                const result = e.hp / weapon.damage;
                                newHp = result === 1 ? 0 : result;
                                newTimer = 0;
                                success = true;
                            } else {
                                success = false;
                            }

                            return { ...e, hp: newHp, attackTimer: newTimer };
                        }
                        return e;
                    }).filter(e => e.hp > 0);

                    // Generic Tutorial Condition Check
                    if (state.gameMode === 'tutorial') {
                        const stepData = (tutorialData.steps as any)[state.tutorialProgress.toString()];
                        if (stepData && stepData.condition) {
                            let conditionMet = false;

                            if (stepData.condition === 'attack_fail' && !success) conditionMet = true;
                            else if (stepData.condition === 'attack_success' && success) conditionMet = true;
                            else if (stepData.condition === 'phase_clear' && updatedEnemies.length === 0) conditionMet = true;

                            if (conditionMet) {
                                triggerNext = true;
                                nextStepVal = stepData.nextStep;
                                delayVal = stepData.delay || 0;
                            }
                        }
                    } else if (updatedEnemies.length === 0 && state.enemies.length > 0) {
                        // Normal mode respawn
                        setTimeout(() => get().spawnEnemies(), 500);
                    }

                    const killCount = state.enemies.length - updatedEnemies.length;
                    const newScore = state.score + (killCount * 10);

                    return {
                        enemies: updatedEnemies,
                        score: newScore
                    };
                });

                if (triggerNext && nextStepVal !== undefined) {
                    setTimeout(() => {
                        // Advance
                        get().advanceTutorial(nextStepVal);

                        // Side Effects
                        if (nextStepVal === 20) {
                            setTimeout(() => get().spawnEnemies(), 100); // Phase 2
                            set({ tutorialStep: 2 });
                        }
                        if (nextStepVal === 30) {
                            set({ tutorialStep: 3 }); // Complete
                        }
                    }, delayVal);
                }

                return success;
            },

            gameTick: (deltaTime) => {
                set((state) => {
                    // 1. Strict Guard: If already game over or paused, do NOTHING.
                    if (state.isGameOver || state.isMenuOpen || (state.gameMode === 'tutorial' && state.tutorialStep === 3) || state.isTimerPaused || state.gameMode === 'title') {
                        return state;
                    }

                    let newPlayerHp = state.playerHp;
                    let gameOver = false;

                    const updatedEnemies = state.enemies.map(e => {
                        let timer = e.attackTimer + deltaTime;

                        const count = state.waveSize || 1;
                        const interval = e.attackInterval !== undefined ? e.attackInterval : (5000 * count);

                        if (interval > 0 && timer >= interval) {
                            newPlayerHp -= e.damage; // Use enemy damage
                            timer = 0;
                            e.lastAttackTime = Date.now();
                        }
                        return { ...e, attackTimer: timer };
                    });

                    // Invincibility check: Prevent death
                    if (state.isInvincible && newPlayerHp <= 0) {
                        newPlayerHp = 1;
                    }

                    if (newPlayerHp <= 0) {
                        newPlayerHp = 0;
                        gameOver = true;
                    }

                    // If Game Over just happened, return state with isGameOver=true
                    // This atomic update prevents race conditions in the next tick
                    return {
                        enemies: updatedEnemies,
                        playerHp: newPlayerHp,
                        isGameOver: gameOver
                    };
                });
            },

            restartGame: () => {
                const state = get();
                // Determine start mode based on completion if restarting generically? 
                // But usually restart is bound to "Retry" or "Start Game".
                // If restart called from menu with setGameMode, mode is already set.

                // If initializing and tutorial not complete, force tutorial?
                // Actually persistence handles reloading state. 
                // We need a way to ensure first load = tutorial if !isTutorialCompleted.
                // We can check this in App's useEffect or here.

                set({
                    sessionId: state.sessionId + 1,
                    enemies: [],
                    score: 0,
                    weaponCooldowns: {},
                    playerHp: 5,
                    isGameOver: false,
                    waveSize: 0,
                    // If tutorial, reset step to 1
                    tutorialStep: state.gameMode === 'tutorial' ? 1 : 0
                });
                get().spawnEnemies();
            }
        }),
        {
            name: 'antigravity-storage',
            partialize: (state) => ({ isTutorialCompleted: state.isTutorialCompleted }), // Only persist completion status
        }
    )
);
