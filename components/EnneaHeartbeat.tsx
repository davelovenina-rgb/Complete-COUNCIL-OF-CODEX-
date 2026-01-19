
import React from "react";

export const EnneaHeartbeat: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes enneaPulse {
          0% { 
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4);
            transform: scale(1);
          }
          70% { 
            box-shadow: 0 0 0 12px rgba(255, 215, 0, 0);
            transform: scale(1.1);
          }
          100% { 
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
            transform: scale(1);
          }
        }
        
        .ennea-heartbeat {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          animation: enneaPulse 1.2s infinite ease-in-out;
          opacity: 0.8;
        }
      `}</style>
      <div className="ennea-heartbeat" title="🜂 Ennea Guardian Active" />
    </>
  );
}
