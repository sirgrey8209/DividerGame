import React from 'react';

interface GuideModalProps {
    title: string;
    content: React.ReactNode;
    buttonText?: string;
    onNext: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ title, content, buttonText = "확인", onNext }) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
        }}>
            <div style={{
                width: 'min(85vw, 400px)',
                maxHeight: '90vh',
                backgroundColor: 'rgba(0,0,0,0.85)',
                borderRadius: '20px',
                border: '2px solid #00ffcc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px',
                textAlign: 'center',
                boxShadow: '0 0 30px rgba(0, 255, 204, 0.2)'
            }}>
                <h1 style={{
                    fontSize: '2rem',
                    color: '#00ffcc',
                    marginBottom: '10px',
                    textShadow: '0 0 10px rgba(0,255,204,0.5)'
                }}>
                    {title}
                </h1>

                <div style={{
                    fontSize: '1.2rem',
                    marginBottom: '20px',
                    marginTop: '10px',
                    color: '#ddd',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6'
                }}>
                    {content}
                </div>

                <button
                    onClick={onNext}
                    style={{
                        padding: '12px 30px',
                        fontSize: '1.2rem',
                        backgroundColor: '#ffd700',
                        color: 'black',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                        marginBottom: '10px'
                    }}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};
