import { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore, WEAPONS, type WeaponData } from './store/useGameStore';
import { FlashOverlay } from './components/FlashOverlay';
import { Layout } from './components/Layout';
import { Enemy, type EnemyHandle } from './components/Enemy';
import { Weapon } from './components/Weapon';
import { Player, type PlayerHandle } from './components/Player';
import { Menu } from './components/Menu';
import { GuideModal } from './components/GuideModal';
import { GuideOverlay } from './components/GuideOverlay';
import { TutorialCompleteModal } from './components/TutorialCompleteModal';
import { WorldMap } from './components/WorldMap/WorldMap';
import { TitleScreen } from './components/TitleScreen';
import tutorialData from './data/tutorialData.json';
import dungeonData from './data/dungeonData.json';
import './index.css';

function App() {
  const {
    enemies, weaponCooldowns, playerHp, maxPlayerHp, isGameOver, waveSize,
    damageEnemy, triggerCooldown, gameTick, restartGame,
    setMenuOpen, gameMode, currentScene, tutorialStep, selectedDungeonId, currentWaveIndex,
    isDungeonCleared, showRewardPopup, confirmDungeonClear, closeRewardPopup,
    tutorialProgress, lockedWeaponIds, highlightedWeaponIds, advanceTutorial, sessionId
  } = useGameStore();
  const [, setTick] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [dragState, setDragState] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    clickOffsetX: number;
    clickOffsetY: number;
    weapon: WeaponData | null;
    snappedId: string | null;
    snapPos: { x: number, y: number } | null;
  }>({
    active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, clickOffsetX: 0, clickOffsetY: 0, weapon: null, snappedId: null, snapPos: null
  });

  const enemyRefs = useRef<Map<string, EnemyHandle>>(new Map());
  const playerRef = useRef<PlayerHandle>(null);
  const lastProgressRef = useRef<number>(-1);

  // Remaining code... (omitted for brevity, will be auto-matched but safer to be specific if context allows)
  // Actually, let's just target the state init and onStartDrag separately if needed or combine.
  // The replace block needs to be contiguous.

  // Let's rewrite the state init part first.


  // Handle Initial Start Logic
  // Handle Initial Start Logic
  useEffect(() => {
    // Force Title Screen on mount/reload
    useGameStore.getState().setCurrentScene('title');
    useGameStore.getState().setGameMode('title');

    const timer = setInterval(() => {
      setTick(t => t + 1);
      gameTick(100);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Tutorial Flow Logic (Data Driven)
  useEffect(() => {
    if (gameMode !== 'tutorial') return;

    const stepData = (tutorialData.steps as any)[tutorialProgress.toString()];
    if (!stepData) return;

    const updates: any = {};

    // Apply locks and highlights from JSON
    // Apply locks (default to empty if missing)
    updates.lockedWeaponIds = stepData.lockWeapons || [];

    // Apply Highlights (default to empty if missing)
    if (stepData.highlightWeapons) {
      if (stepData.highlightWeapons === 'valid') {
        const currentEnemy = useGameStore.getState().enemies[0];
        if (currentEnemy) {
          // "Valid" = Blue (Square) and Divisible
          updates.highlightedWeaponIds = WEAPONS
            .filter(w => w.shape === 'square' && currentEnemy.hp % w.damage === 0)
            .map(w => w.id);
        } else {
          updates.highlightedWeaponIds = [];
        }
      } else {
        updates.highlightedWeaponIds = stepData.highlightWeapons;
      }
    } else {
      updates.highlightedWeaponIds = [];
    }

    // Modal & Timer Logic (Only on Step Entry)
    const isNewStep = lastProgressRef.current !== tutorialProgress;

    if (isNewStep) {
      lastProgressRef.current = tutorialProgress;

      if (stepData.modal) {
        setIsModalOpen(true);
        updates.isTimerPaused = true;
      } else {
        setIsModalOpen(false);
        updates.isTimerPaused = false;
      }
    }

    // Special Case: Step 23/Combat overrides
    if (tutorialProgress === 23) {
      updates.isTimerPaused = false;
      updates.isInvincible = true;
      updates.lockedWeaponIds = [];
      updates.highlightedWeaponIds = [];
    }

    // Apply updates only if actually changed to prevent infinite loops with 'enemies' dependency
    if (Object.keys(updates).length > 0) {
      const currentState = useGameStore.getState();
      const finalUpdates: any = {};

      Object.keys(updates).forEach(key => {
        const newVal = updates[key];
        const oldVal = (currentState as any)[key];

        let changed = false;
        if (Array.isArray(newVal) && Array.isArray(oldVal)) {
          if (newVal.length !== oldVal.length) {
            changed = true;
          } else {
            const sNew = [...newVal].sort();
            const sOld = [...oldVal].sort();
            if (!sNew.every((v: any, i: number) => v === sOld[i])) changed = true;
          }
        } else if (newVal !== oldVal) {
          changed = true;
        }

        if (changed) finalUpdates[key] = newVal;
      });

      if (Object.keys(finalUpdates).length > 0) {
        useGameStore.setState(finalUpdates);
      }
    }

  }, [tutorialProgress, gameMode, enemies]);

  const handleModalNext = () => {
    setIsModalOpen(false);
    useGameStore.setState({ isTimerPaused: false });

    const stepData = (tutorialData.steps as any)[tutorialProgress.toString()];
    // If no overlay and no condition, advance immediately (e.g. Modal only steps)
    if (stepData && !stepData.overlay && !stepData.condition && stepData.nextStep) {
      advanceTutorial(stepData.nextStep);
    }
  };

  const handleRegisterEnemy = (id: string, handle: EnemyHandle | null) => {
    if (handle) enemyRefs.current.set(id, handle);
    else enemyRefs.current.delete(id);
  };

  const onStartDrag = (e: React.PointerEvent, weapon: WeaponData) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const readyAt = weaponCooldowns[weapon.id] || 0;
    if (Date.now() < readyAt) return;
    if (lockedWeaponIds.includes(weapon.id)) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top; // Start from top edge

    setDragState({
      active: true,
      startX: startX,
      startY: startY,
      currentX: e.clientX,
      currentY: e.clientY,
      clickOffsetX: e.clientX - startX,
      clickOffsetY: e.clientY - startY,
      weapon: weapon,
      snappedId: null,
      snapPos: null
    });
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragState.active) return;

      // Corrected vector: (Current - Start) - (InitialOffset)
      const dx = (e.clientX - dragState.startX) - dragState.clickOffsetX;
      const dy = (e.clientY - dragState.startY) - dragState.clickOffsetY;
      const distFromStart = Math.sqrt(dx * dx + dy * dy);

      let newSnappedId: string | null = null;
      let newSnapPos: { x: number, y: number } | null = null;

      // Calculate Snap Target (Determine "State B" Goal)
      if (distFromStart > 10) {
        const dragAngle = Math.atan2(dy, dx);
        let minAngleDiff = Infinity;

        enemyRefs.current.forEach((handle, id) => {
          const el = handle.domNode;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const enemyCenterX = rect.left + rect.width / 2;
          const enemyCenterY = rect.bottom;

          const enemyAngle = Math.atan2(enemyCenterY - dragState.startY, enemyCenterX - dragState.startX);

          let diff = Math.abs(dragAngle - enemyAngle);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;

          // Align check (roughly +/- 60 degrees seems generous, but fine for mobile feel)
          if (diff < 1.0) {
            if (diff < minAngleDiff) {
              minAngleDiff = diff;
              newSnappedId = id;
              newSnapPos = { x: enemyCenterX, y: enemyCenterY };
            }
          }
        });
      }

      setDragState(prev => ({
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
        snappedId: newSnappedId,
        snapPos: newSnapPos
      }));
    };

    const handleUp = (e: PointerEvent) => {
      if (!dragState.active) return;

      const dx = (e.clientX - dragState.startX) - dragState.clickOffsetX;
      const dy = (e.clientY - dragState.startY) - dragState.clickOffsetY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only fire if dragged significantly (State B reached or close to it)
      // User said "Click = small arrow", imply no fire.
      if (dist > 50 && dragState.snappedId && dragState.weapon) {
        const success = damageEnemy(dragState.snappedId, dragState.weapon);
        const handle = enemyRefs.current.get(dragState.snappedId);
        if (success) {
          triggerCooldown(dragState.weapon.id, dragState.weapon.cooldown);
          handle?.animateSuccess();
        } else {
          triggerCooldown(dragState.weapon.id, 1000);
          handle?.animateFailure();
        }
        playerRef.current?.animateAttack();
      }

      setDragState(prev => ({ ...prev, active: false, weapon: null, snappedId: null, snapPos: null }));
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragState.active, dragState.weapon, dragState.startX, dragState.startY, dragState.clickOffsetX, dragState.clickOffsetY, dragState.snappedId, damageEnemy, triggerCooldown]);

  const getPath = () => {
    const { startX, startY, currentX, currentY, snapPos, clickOffsetX, clickOffsetY } = dragState;

    // Current Drag Vector (Corrected)
    const dx = (currentX - startX) - clickOffsetX;
    const dy = (currentY - startY) - clickOffsetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let finalVecX, finalVecY;

    // Phase 1: Dist < 10 (Vertical Growth 30->40)
    if (dist < 10) {
      // 30 at 0, 40 at 10
      const length = 30 + dist; // 0->30, 10->40
      finalVecX = startX;
      finalVecY = startY - length;
    }
    else {
      // Phase 2 & 3: Dist >= 10
      // Calculate interpolation factor t
      let t = 0;
      if (dist >= 50) {
        t = 1.0;
      } else {
        // Range 10..50 maps to 0..0.8
        const ratio = (dist - 10) / (50 - 10); // 0..1
        t = ratio * 0.8;
      }

      // Calculate Target Point
      let targetX, targetY;
      if (snapPos) {
        targetX = snapPos.x;
        targetY = snapPos.y;
      } else {
        // If no snap, project to 'dist' (follow cursor)
        const scale = 1;
        targetX = startX + dx * scale;
        targetY = startY + dy * scale;
      }

      // Base Point (End of Phase 1): Upwards 40px
      const baseTipX = startX;
      const baseTipY = startY - 40;

      // Lerp
      finalVecX = baseTipX * (1 - t) + targetX * t;
      finalVecY = baseTipY * (1 - t) + targetY * t;
    }

    return `M ${startX} ${startY} Q ${startX} ${startY - 20} ${finalVecX} ${finalVecY}`;
  };

  const getCooldownProgress = (id: string, duration = 3000) => {
    const readyAt = weaponCooldowns[id] || 0;
    const now = Date.now();
    if (now >= readyAt) return 1;
    const remaining = readyAt - now;
    return Math.max(0, 1 - (remaining / duration));
  };



  return (
    <Layout>
      <Menu />

      {/* SCENE: TITLE */}
      {currentScene === 'title' && <TitleScreen />}

      {/* SCENE: WORLD MAP */}
      {currentScene === 'worldmap' && <WorldMap />}

      {/* SCENE: GAME (Title, Tutorial, Dungeon, Normal) */}
      {currentScene === 'game' && (
        <>
          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              zIndex: 1000,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 10
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          </button>

          <div style={{ position: 'absolute', top: 40, right: 20, color: '#ffd700', fontSize: '1.2rem', fontWeight: 'bold', zIndex: 100 }}>
            {gameMode === 'tutorial'
              ? `TUTORIAL ${Math.min(tutorialStep, 2)}/2`
              : (gameMode === 'dungeon' && selectedDungeonId)
                ? `DUNGEON ${selectedDungeonId} (${currentWaveIndex + 1}/${dungeonData.find(d => d.id === selectedDungeonId)?.waves.length || '?'})`
                : ''}
          </div>

          {/* 1. ENEMY AREA (Top) */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '40%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            zIndex: 5
          }}>
            <AnimatePresence key={sessionId}>
              {enemies.map(enemy => {
                const interval = enemy.attackInterval ?? (5000 * (waveSize || 1));
                return (
                  <Enemy
                    key={enemy.id}
                    {...enemy}
                    attackTimer={enemy.attackTimer}
                    lastAttackTime={enemy.lastAttackTime}
                    maxAttackTimer={interval < 0 ? -1 : interval}
                    ref={(handle) => handleRegisterEnemy(enemy.id, handle)}
                  />
                );
              })}
            </AnimatePresence>
          </div>

          {/* 2. PLAYER AREA (Middle) */}
          <div style={{
            position: 'absolute',
            top: '65%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <Player ref={playerRef} hp={playerHp} maxHp={maxPlayerHp} />
          </div>

          {/* 3. WEAPON & UI AREA (Bottom) */}

          {/* HP TEXT & BAR */}
          <div style={{
            position: 'absolute',
            bottom: 110,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            zIndex: 15
          }}>
            <div style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '1.2rem', textShadow: '0 0 5px rgba(0,255,204,0.5)' }}>
              {playerHp} / {maxPlayerHp}
            </div>
            <div style={{
              width: '200px',
              height: '10px',
              backgroundColor: '#333',
              borderRadius: '5px',
              border: '1px solid #555',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(playerHp / maxPlayerHp) * 100}%`,
                height: '100%',
                backgroundColor: playerHp > 2 ? '#00ffcc' : '#ff4444',
                transition: 'width 0.2s ease-out, background-color 0.2s'
              }} />
            </div>
          </div>

          {/* RED DAMAGE FLASH OVERLAY */}
          <FlashOverlay playerHp={playerHp} />

          {/* Square Weapons Split: 2 and 2 - Layer 1 (Bottom) */}
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            gap: '90px',
            zIndex: 20,
            pointerEvents: 'none'
          }}>
            {/* Left Pair */}
            <div style={{ display: 'flex', gap: '15px', pointerEvents: 'auto' }}>
              {WEAPONS.slice(1, 3).map(w => (
                <Weapon
                  key={w.id}
                  data={w}
                  onStartDrag={onStartDrag}
                  isReady={Date.now() >= (weaponCooldowns[w.id] || 0)}
                  cooldownProgress={getCooldownProgress(w.id, w.cooldown)}
                  isLocked={lockedWeaponIds.includes(w.id)}
                  isHighlighted={highlightedWeaponIds.includes(w.id)}
                />
              ))}
            </div>
            {/* Right Pair */}
            <div style={{ display: 'flex', gap: '15px', pointerEvents: 'auto' }}>
              {WEAPONS.slice(3, 5).map(w => (
                <Weapon
                  key={w.id}
                  data={w}
                  onStartDrag={onStartDrag}
                  isReady={Date.now() >= (weaponCooldowns[w.id] || 0)}
                  cooldownProgress={getCooldownProgress(w.id, w.cooldown)}
                  isLocked={lockedWeaponIds.includes(w.id)}
                  isHighlighted={highlightedWeaponIds.includes(w.id)}
                />
              ))}
            </div>
          </div>

          {/* Circle Weapon - Layer 2 (Raised) */}
          <div style={{
            position: 'absolute',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 21
          }}>
            <Weapon
              data={WEAPONS[0]}
              onStartDrag={onStartDrag}
              isReady={Date.now() >= (weaponCooldowns[WEAPONS[0].id] || 0)}
              cooldownProgress={getCooldownProgress(WEAPONS[0].id, WEAPONS[0].cooldown)}
              isLocked={lockedWeaponIds.includes(WEAPONS[0].id)}
              isHighlighted={highlightedWeaponIds.includes(WEAPONS[0].id)}
            />
          </div>

          {dragState.active && (
            <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }}>
              <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#fff" />
                </marker>
              </defs>
              <path d={getPath()} stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" markerEnd="url(#arrowhead)" style={{ filter: 'drop-shadow(0 0 5px #fff)' }} />
              <circle cx={dragState.currentX} cy={dragState.currentY} r="10" fill="white" />
            </svg>
          )}

          {/* GAME OVER OVERLAY */}
          {isGameOver && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 10000,
              color: 'white'
            }}>
              <h1 style={{ fontSize: '3rem', color: '#ff4444', marginBottom: '20px' }}>GAME OVER</h1>

              <button
                onClick={restartGame}
                style={{
                  padding: '15px 40px',
                  fontSize: '1.5rem',
                  backgroundColor: '#00ffcc',
                  color: 'black',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                RETRY
              </button>
            </div>
          )}
        </>
      )}



      {/* GUIDED TUTORIAL UI */}
      {/* GUIDED TUTORIAL UI (Data Driven) */}
      {gameMode === 'tutorial' && (() => {
        const stepData = (tutorialData.steps as any)[tutorialProgress.toString()];
        if (!stepData) return null;

        if (isModalOpen && stepData.modal) {
          return (
            <GuideModal
              title={stepData.modal.title}
              content={stepData.modal.content}
              buttonText={stepData.modal.buttonText}
              onNext={handleModalNext}
            />
          );
        }

        if (!isModalOpen && stepData.overlay) {
          return (
            <GuideOverlay
              text={stepData.overlay.text}
              position={stepData.overlay.position}
            />
          );
        }
        return null;
      })()}

      {/* DUNGEON CLEAR OVERLAY */}
      {gameMode === 'dungeon' && isDungeonCleared && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
          color: 'white',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#ffd700',
            marginBottom: '40px',
            textShadow: '0 0 20px #ffd700',
            animation: 'scaleIn 0.5s ease-out',
            textAlign: 'center',
            width: '100%',
            maxWidth: '350px', // Restrict to portrait width
            lineHeight: '1.2',
            wordBreak: 'keep-all'
          }}>
            DUNGEON CLEARED!
          </h1>
          <button
            onClick={confirmDungeonClear}
            style={{
              padding: '20px 60px',
              fontSize: '1.5rem',
              backgroundColor: '#00ffcc',
              color: 'black',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 0 20px #00ffcc',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            월드맵으로
          </button>
        </div>
      )}

      {/* REWARD MODAL */}
      {currentScene === 'worldmap' && showRewardPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 10001
        }}>
          <div style={{
            width: '80%', maxWidth: '400px',
            backgroundColor: '#1a1a1a',
            border: '2px solid #00ffcc',
            borderRadius: '16px',
            padding: '40px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 0 30px rgba(0,255,204,0.3)',
            color: 'white'
          }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: '#00ffcc' }}>보상 획득</h2>
            <div style={{ fontSize: '1.2rem', marginBottom: '40px', textAlign: 'center' }}>
              던전 클리어 보상을 획득했습니다!<br />
              <span style={{ fontSize: '0.9rem', color: '#888' }}>(보상 시스템 구현 예정)</span>
            </div>
            <button
              onClick={closeRewardPopup}
              style={{
                padding: '12px 40px',
                fontSize: '1.2rem',
                backgroundColor: '#00ffcc',
                color: 'black',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

    </Layout>
  );
}

export default App;
