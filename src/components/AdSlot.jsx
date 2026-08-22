import React from "react";

export default function AdSlot({ label = "Advertisement", className = "" }) {
  return (
    <div className={`ad-slot ${className}`} aria-label="Advertisement">
      <span>{label}</span>
    </div>
  );
}
