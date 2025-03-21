"use client";

/**
 * LascoPayButton Component
 * 
 * Known Changes:
 * 1. Props Simplification (2024-03-XX)
 *    - Removed unused totalAmount prop
 *    - Simplified interface to only include onClick and disabled props
 *    - Improved type safety by removing unnecessary props
 */

interface LascoPayButtonProps {
    onClick?: () => void;
    disabled?: boolean;
}

export default function LascoPayButton({
    onClick,
    disabled = false,
}: LascoPayButtonProps) {
    return (
        <div
            onClick={disabled ? undefined : onClick}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1 }}
        >
            <a
                id="btn-btn-TANTIG"
                href={onClick ? "#" : "https://pay.lascobizja.com/btn/YFxrwuD1qO9k"}
                onClick={e => {
                    if (onClick) {
                        e.preventDefault();
                        onClick();
                    }
                }}
                style={{ textDecoration: "none" }}
            >
                <div style={{ width: "230px", display: "flex" }}>
                    <div
                        style={{
                            background: "#40e0d0",
                            color: "#fff",
                            borderRight: "1px solid #fff",
                            width: "55px",
                            padding: "1%",
                            textAlign: "center",
                            borderRadius: "12px 0px 0px 12px",
                        }}
                    >
                        <img
                            src="https://merchant-portal.lascobizja.com/template/assets/images/lasco-favicon.png"
                            style={{ width: "90%", marginTop: "8px" }}
                            alt="Lasco Pay"
                        />
                    </div>
                    <div
                        style={{
                            background: "#40e0d0",
                            color: "#fff",
                            padding: "7.5px 15px",
                            borderRadius: "0px 12px 12px 0px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "14px",
                                display: "block",
                                textTransform: "capitalize",
                                lineHeight: "10px",
                                marginTop: "4px",
                                color: "black",
                                fontWeight: "bold",
                            }}
                        >
                            Pay Now
                        </span>
                        <span style={{
                            fontSize: "10px", color: "black",
                            fontWeight: "bold",
                        }}>Powered by Lasco</span>
                    </div>
                </div>
            </a>
        </div>
    );
} 