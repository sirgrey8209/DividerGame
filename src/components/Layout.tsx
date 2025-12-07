import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div style={{
            width: '100vw',
            height: '100dvh',
            backgroundColor: '#111',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '450px', // slightly wider than standard phone
                height: '100%', // Full height
                maxHeight: '900px', // Limit height on large screens
                backgroundColor: '#1a1a1a',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 0 50px rgba(0,0,0,0.5)'
            }}>
                {children}
            </div>
        </div>
    );
};
