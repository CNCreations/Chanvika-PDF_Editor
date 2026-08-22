import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Upload from "./Upload";

export default function ToolPage({ title, description, color="blue", accept, multiple, onFiles, children, onBack }) {
  return (
    <div className={`tool-page theme-${color}`}>
      <div className="tool-page-top">
        <button className="ghost-btn" onClick={onBack}><ArrowLeft size={16}/> Home</button>
      </div>
      <div className="tool-hero">
        <span className="section-kicker">{title}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children || <Upload accept={accept} multiple={multiple} onFiles={onFiles}/>}
      <div className="tool-back"><button className="secondary-btn" onClick={onBack}>Back to tools <ArrowRight size={16}/></button></div>
    </div>
  );
}
