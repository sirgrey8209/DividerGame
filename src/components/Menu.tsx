import { useGameStore } from '../store/useGameStore';

export const Menu = () => {
    const {
        isMenuOpen, setMenuOpen,
        restartGame,
        resetProgress,
        gameMode,
        completeTutorialAndStartGame
    } = useGameStore();

    if (!isMenuOpen) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 20000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
        }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '40px', color: '#00ffcc' }}>MENU</h2>

            <button
                onClick={() => setMenuOpen(false)}
                style={buttonStyle}
            >
                계속하기
            </button>

            <button
                onClick={() => {
                    restartGame();
                    setMenuOpen(false);
                }}
                style={buttonStyle}
            >
                다시 시작
            </button>

            <div style={{ height: '20px' }}></div>

            <div style={{ height: '20px' }}></div>

            {gameMode === 'tutorial' ? (
                <button
                    onClick={() => {
                        completeTutorialAndStartGame();
                        setMenuOpen(false);
                    }}
                    style={{
                        ...buttonStyle,
                        backgroundColor: '#ffd700',
                        color: 'black',
                    }}
                >
                    튜토리얼 건너뛰기
                </button>
            ) : (
                <button
                    onClick={() => {
                        const confirmReset = window.confirm("정말로 모든 데이터를 초기화하시겠습니까? (되돌릴 수 없습니다)");
                        if (confirmReset) {
                            resetProgress();
                        }
                    }}
                    style={{
                        ...buttonStyle,
                        backgroundColor: '#ff4444',
                        color: 'white',
                    }}
                >
                    데이터 초기화
                </button>
            )}
        </div>
    );
};

const buttonStyle: React.CSSProperties = {
    padding: '15px 40px',
    fontSize: '1.5rem',
    backgroundColor: 'white',
    color: 'black',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '20px',
    width: '300px',
    textAlign: 'center'
};
