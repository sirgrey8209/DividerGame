import React from 'react';

interface GuideOverlayProps {
    text: string;
    position?: 'top' | 'center' | 'bottom' | 'near-weapons';
}

export const GuideOverlay: React.FC<GuideOverlayProps> = ({ text, position = 'center' }) => {
    let style: React.CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '20px 30px',
        borderRadius: '20px',
        border: '1px solid #00ffcc',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        zIndex: 9000,
        pointerEvents: 'none', // Modeless: allow clicking through
        whiteSpace: 'pre-wrap',
        maxWidth: '95vw',
        minWidth: 'min(95vw, 360px)',
        textAlign: 'center',
        boxShadow: '0 0 15px rgba(0, 255, 204, 0.3)'
    };

    switch (position) {
        case 'top':
            style.top = '30%';
            break;
        case 'bottom':
            style.bottom = '150px'; // Above UI
            break;
        case 'near-weapons':
            style.bottom = '180px';
            break;
        case 'center':
        default:
            style.top = '50%';
            style.transform = 'translate(-50%, -50%)';
            break;
    }

    return (
        <div style={style}>
            {text}
        </div>
    );
};
