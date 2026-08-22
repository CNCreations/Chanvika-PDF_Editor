import React, { useRef, useState } from "react";
import { FileUp } from "lucide-react";

export default function Upload({ accept=".pdf,application/pdf", multiple=false, onFiles }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);

  const choose = (files) => {
    const list = [...(files || [])];
    if (list.length) onFiles(multiple ? list : [list[0]]);
  };

  return (
    <div
      className={`upload-zone ${drag ? "dragging" : ""}`}
      onDragOver={(e)=>{e.preventDefault();setDrag(true)}}
      onDragLeave={()=>setDrag(false)}
      onDrop={(e)=>{e.preventDefault();setDrag(false);choose(e.dataTransfer.files)}}
      onClick={()=>ref.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e)=>e.key==="Enter" && ref.current?.click()}
    >
      <div className="upload-icon"><FileUp/></div>
      <h3>Drop your file{multiple ? "s" : ""} here</h3>
      <p>or <b>browse files</b></p>
      <small>Your files are processed in your browser for supported tools.</small>
      <input ref={ref} hidden type="file" accept={accept} multiple={multiple} onChange={(e)=>choose(e.target.files)} />
    </div>
  );
}
