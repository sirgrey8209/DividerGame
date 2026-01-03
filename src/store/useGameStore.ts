import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import gameData from '../data/gameData.json';
import tutorialData from '../data/tutorialData.json';
import dungeonData from '../data/dungeonData.json';

export interface EnemyData {
    id: string;
    hp: number;
    maxHp: number;
    x: number;
    y: number;
    attackTimer: number; // ms accumulated
    lastAttackTime: number; // Timestamp of last attack
    damage: number;
    attackInterval?: number;
    isBoss?: boolean;
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
    weaponCooldowns: Record<string, number>;

    playerHp: number;
    maxPlayerHp: number;
    isGameOver: boolean;
    waveSize: number;

    isMenuOpen: boolean;
    gameMode: 'title' | 'normal' | 'tutorial' | 'dungeon';
    currentScene: 'menu' | 'worldmap' | 'game' | 'title';
    maxUnlockedDungeonId: number;
    selectedDungeonId: number | null;
    currentWaveIndex: number; // For dungeon progression

    tutorialStep: number;
    tutorialProgress: number; // Granular step for guided tutorial (10-30)
    isTutorialCompleted: boolean;
    lockedWeaponIds: string[];
    highlightedWeaponIds: string[];
    isTimerPaused: boolean;
    isInvincible: boolean; // Prevent death during critical lessons
    sessionId: number; // Used to force remount of components (like AnimatePresence) on clear

    // Dungeon Clear Flow
    isDungeonCleared: boolean;
    showRewardPopup: boolean;

    spawnEnemies: () => void;
    damageEnemy: (id: string, weapon: WeaponData) => boolean;
    triggerCooldown: (id: string, duration?: number) => void;

    gameTick: (deltaTime: number) => void;
    restartGame: () => void;
    setMenuOpen: (isOpen: boolean) => void;

    setGameMode: (mode: 'title' | 'normal' | 'tutorial' | 'dungeon') => void;
    setCurrentScene: (scene: 'menu' | 'worldmap' | 'game' | 'title') => void;
    selectDungeon: (id: number) => void;
    completeDungeon: (id: number) => void;
    confirmDungeonClear: () => void;
    closeRewardPopup: () => void;
    completeTutorialAndStartGame: () => void;
    resetProgress: () => void;
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
            weaponCooldowns: {},
            playerHp: 5,
            maxPlayerHp: 5,
            isGameOver: false,
            waveSize: 0,
            isMenuOpen: false,

            gameMode: 'normal',
            currentScene: 'menu',
            maxUnlockedDungeonId: 1,
            selectedDungeonId: null,
            currentWaveIndex: 0,

            tutorialStep: 0,
            tutorialProgress: 0,
            isTutorialCompleted: false,
            lockedWeaponIds: [],
            highlightedWeaponIds: [],
            isTimerPaused: false,
            isInvincible: false,
            sessionId: 0,
            isDungeonCleared: false,
            showRewardPopup: false,

            setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),
            setCurrentScene: (scene) => set({ currentScene: scene }),

            selectDungeon: (id) => {
                set({
                    selectedDungeonId: id,
                    gameMode: 'dungeon',
                    currentScene: 'game', // Fix: Enter game scene
                    currentWaveIndex: 0
                });
                get().restartGame();
            },

            completeDungeon: (id) => {
                const { maxUnlockedDungeonId } = get();
                if (id >= maxUnlockedDungeonId && maxUnlockedDungeonId < 6) {
                    set({ maxUnlockedDungeonId: maxUnlockedDungeonId + 1 });
                }
                set({ currentScene: 'worldmap', showRewardPopup: true });
            },

            confirmDungeonClear: () => {
                const { selectedDungeonId } = get();
                if (selectedDungeonId) {
                    get().completeDungeon(selectedDungeonId);
                }
                set({ isDungeonCleared: false });
            },

            closeRewardPopup: () => {
                set({ showRewardPopup: false });
            },

            resetProgress: () => {
                set({
                    isTutorialCompleted: false,
                    maxUnlockedDungeonId: 1,
                    tutorialProgress: 0,
                    tutorialStep: 0,
                    gameMode: 'title',
                    currentScene: 'title',
                    isMenuOpen: false,
                    isDungeonCleared: false,
                    showRewardPopup: false
                });
                // Force reset other game states
                get().restartGame();
            },

            setGameMode: (mode) => {
                set({
                    gameMode: mode,
                    tutorialStep: mode === 'tutorial' ? 1 : 0,
                    tutorialProgress: mode === 'tutorial' ? 10 : 0, // Start at 10 for guided flow
                    isTutorialCompleted: mode === 'tutorial' ? false : get().isTutorialCompleted,
                    lockedWeaponIds: [],
                    highlightedWeaponIds: [],

                    isTimerPaused: false,
                    isInvincible: false,
                    isDungeonCleared: false,
                    showRewardPopup: false
                });
                get().restartGame();
            },

            completeTutorialAndStartGame: () => {
                set({
                    isTutorialCompleted: true,
                    currentScene: 'worldmap',
                    gameMode: 'dungeon',
                    isMenuOpen: false,
                    isGameOver: false,
                    isTimerPaused: false,
                    isInvincible: false,
                    lockedWeaponIds: [],
                    highlightedWeaponIds: []
                });
                // No restartGame() needed as we switch scene
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
                } else if (gameMode === 'dungeon') {
                    const { selectedDungeonId, currentWaveIndex } = get();
                    if (selectedDungeonId !== null) {
                        const dungeon = dungeonData.find(d => d.id === selectedDungeonId);
                        if (dungeon && dungeon.waves[currentWaveIndex]) {
                            const waveData = dungeon.waves[currentWaveIndex];
                            // Currently single enemy per wave in definition, but structure implies array if we wanted multiple.
                            // However, dungeonData waves is array of objects, implying SEQUENTIAL waves of SINGLE enemies?
                            // OR does each object in "waves" represent a single enemy entity?
                            // Based on json: "waves": [ {hp:10...}, {hp:15...} ]
                            // This looks like sequential spawning of single enemies. 
                            // Let's treat them as a sequence. "currentWaveIndex" points to the current enemy to fight.
                            // Actually, typical game: Wave = group of enemies.
                            // But here JSON is [ {enemy1}, {enemy2}, {boss} ]. 
                            // So let's spawn ONE enemy at a time for this game style (based on divider logic).

                            newEnemies.push({
                                id: crypto.randomUUID(),
                                hp: waveData.hp,
                                maxHp: waveData.maxHp,
                                x: 0,
                                y: 0,
                                attackTimer: 0,
                                lastAttackTime: 0,
                                damage: waveData.damage,
                                attackInterval: waveData.attackInterval,
                                isBoss: (waveData as any).boss
                            });
                            set({ waveSize: 1 });
                        }
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
                        if (state.gameMode === 'dungeon') {
                            // Proceed to next wave or finish dungeon
                            const { selectedDungeonId, currentWaveIndex } = state;
                            const dungeon = dungeonData.find(d => d.id === selectedDungeonId);

                            if (dungeon) {
                                if (currentWaveIndex + 1 < dungeon.waves.length) {
                                    // Next wave
                                    set({ currentWaveIndex: currentWaveIndex + 1 });
                                    setTimeout(() => get().spawnEnemies(), 500); // Match exit animation (0.5s)
                                } else {
                                    // Dungeon Cleared
                                    if (selectedDungeonId) {
                                        // Trigger Visual Clear State with DELAY for Boss
                                        // Text appears at 1.5s (Boss anim is 2.5s, allowing overlap)
                                        setTimeout(() => {
                                            set({ isDungeonCleared: true });
                                        }, 1500);
                                    }
                                }
                            }
                        } else {
                            // Normal mode respawn
                            setTimeout(() => get().spawnEnemies(), 500); // Faster spawn for flow
                        }
                    }

                    return {
                        enemies: updatedEnemies
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
                    weaponCooldowns: {},
                    playerHp: 5,
                    isGameOver: false,
                    isDungeonCleared: false, // Reset clear state on restart
                    waveSize: 0,
                    // If tutorial, reset step to 1
                    tutorialStep: state.gameMode === 'tutorial' ? 1 : 0
                });
                get().spawnEnemies();
            }
        }),
        {
            name: 'antigravity-storage',
            partialize: (state) => ({
                isTutorialCompleted: state.isTutorialCompleted,
                maxUnlockedDungeonId: state.maxUnlockedDungeonId
            }),
        }
    )
);
