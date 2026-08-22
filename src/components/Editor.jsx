import React, { useEffect, useRef, useState } from "react";
import { pdfjsLib } from "../pdf.js";
import { createOverlay, exportEditedPdf, metadataFromPdf } from "../engine.js";
import { downloadBytes, formatBytes, hexToRgb, uid } from "../utils.js";
import {
  ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Download, FilePlus2,
  Highlighter, ImagePlus, MousePointer2, PenLine, Redo2, RotateCw, Save,
  Settings2, Square, Trash2, Type, Undo2, ZoomIn, ZoomOut, Droplets
} from "lucide-react";

const TOOLS = [
  ["select","Select",MousePointer2],
  ["text","Text",Type],
  ["highlight","Highlight",Highlighter],
  ["draw","Draw",PenLine],
  ["rect","Shape",Square],
  ["image","Image",ImagePlus],
  ["watermark","Watermark",Droplets]
];

export default function Editor({ file, onBack }) {
  const [bytes, setBytes] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [tool, setTool] = useState("select");
  const [overlays, setOverlays] = useState({});
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [rendering, setRendering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState({title:"",author:"",subject:"",keywords:""});
  const [selected, setSelected] = useState(null);
  const canvasRef = useRef(null);
  const pageWrapRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async()=>{
      const b = new Uint8Array(await file.arrayBuffer());
      const p = await pdfjsLib.getDocument({data:b}).promise;
      if (!alive) return;
      setBytes(b); setPdf(p);
      try { setMeta(await metadataFromPdf(b)); } catch {}
    })();
    return ()=>{ alive=false; };
  }, [file]);

  useEffect(() => {
    if (!pdf) return;
    let alive = true;
    (async()=>{
      setRendering(true);
      const p = await pdf.getPage(page);
      const viewport = p.getViewport({scale});
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", {alpha:false});
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      if (alive) await p.render({canvasContext:ctx, viewport}).promise;
      if (alive) setRendering(false);
    })();
    return ()=>{alive=false};
  }, [pdf,page,scale]);

  const snapshot = () => JSON.parse(JSON.stringify(overlays));
  const commit = (next) => {
    setHistory(h=>[...h, snapshot()].slice(-30));
    setFuture([]);
    setOverlays(next);
  };
  const addOverlay = (item) => {
    const next = {...overlays, [page-1]: [...(overlays[page-1]||[]), item]};
    commit(next);
    setSelected(item.id);
  };

  const pageOverlays = overlays[page-1] || [];

  const pointerPosition = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX-rect.left)/rect.width, y:(e.clientY-rect.top)/rect.height };
  };

  const canvasClick = (e) => {
    if (tool === "text") {
      const p = pointerPosition(e);
      const text = prompt("Enter text:");
      if (text) addOverlay(createOverlay("text",{text,x:p.x,y:p.y,size:18,color:"#111827",font:"Helvetica"}));
    } else if (tool === "highlight") {
      const p = pointerPosition(e);
      addOverlay(createOverlay("highlight",{x:Math.max(0,p.x-.05),y:Math.max(0,p.y-.025),width:.18,height:.055,color:"#ffe66d",opacity:.38}));
    } else if (tool === "rect") {
      const p = pointerPosition(e);
      addOverlay(createOverlay("rect",{x:p.x,y:p.y,width:.22,height:.11,color:"#4263ff",stroke:2}));
    } else if (tool === "watermark") {
      const text = prompt("Watermark text:", "PaperFlow");
      if (text) addOverlay(createOverlay("watermark",{text,color:"#64748b",size:42}));
    }
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length-1];
    setFuture(f=>[snapshot(),...f].slice(0,30));
    setOverlays(prev);
    setHistory(h=>h.slice(0,-1));
  };
  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory(h=>[...h,snapshot()].slice(-30));
    setOverlays(next);
    setFuture(f=>f.slice(1));
  };

  const removeSelected = () => {
    if (!selected) return;
    const next = {...overlays};
    next[page-1] = (next[page-1]||[]).filter(x=>x.id!==selected);
    commit(next); setSelected(null);
  };

  const rotateCurrent = () => {
    // Visual rotation is handled as a page-level export feature in the tool suite.
    alert("Page rotation is available from the page tools. The current editor keeps the original PDF page geometry.");
  };

  const exportPdf = async () => {
    if (!bytes) return;
    setBusy(true);
    try {
      const pagesState = Array.from({length:pdf.numPages}, (_,i)=>({originalIndex:i}));
      const out = await exportEditedPdf(bytes,pagesState,overlays,meta);
      downloadBytes(out, `${file.name.replace(/\.pdf$/i,"")}-edited.pdf`);
    } catch (e) {
      console.error(e);
      alert("Could not export this PDF. The original file may use unsupported encryption or structure.");
    } finally { setBusy(false); }
  };

  const onDrawStart = (e) => {
    if (tool !== "draw") return;
    e.preventDefault();
    const start = pointerPosition(e);
    const item = createOverlay("draw",{points:[start],color:"#111827",stroke:2.5});
    const next = {...overlays,[page-1]:[...(overlays[page-1]||[]),item]};
    setOverlays(next); setSelected(item.id);
    const move = (ev) => {
      const p = pointerPosition(ev);
      setOverlays(cur=>{
        const arr = [...(cur[page-1]||[])];
        const idx = arr.findIndex(x=>x.id===item.id);
        if(idx>=0) arr[idx]={...arr[idx],points:[...arr[idx].points,p]};
        return {...cur,[page-1]:arr};
      });
    };
    const up = () => {
      setHistory(h=>[...h,snapshot()].slice(-30));
      setFuture([]);
      window.removeEventListener("pointermove",move);
      window.removeEventListener("pointerup",up);
    };
    window.addEventListener("pointermove",move);
    window.addEventListener("pointerup",up,{once:true});
  };

  const renderOverlay = (item) => {
    const style = {
      position:"absolute",
      left:`${item.x*100}%`,
      top:`${item.y*100}%`,
      pointerEvents:"none",
      transform:item.rotation ? `rotate(${item.rotation}deg)` : undefined
    };
    if(item.type==="text") return <div key={item.id} style={{...style,fontSize:`${item.size*scale}px`,color:item.color,fontFamily:item.font==="Courier"?"monospace":"Arial",fontWeight:500,whiteSpace:"pre"}}>{item.text}</div>;
    if(item.type==="highlight"||item.type==="rect") return <div key={item.id} style={{...style,width:`${item.width*100}%`,height:`${item.height*100}%`,background:item.type==="highlight"?item.color:"transparent",border:item.type==="rect"?`${item.stroke||2}px solid ${item.color}`:"none",opacity:item.opacity??1}}/>;
    if(item.type==="watermark") return <div key={item.id} style={{...style,left:"18%",top:"45%",fontSize:`${item.size*scale}px`,color:item.color,opacity:.18,transform:"rotate(-35deg)"}}>{item.text}</div>;
    if(item.type==="draw") return <svg key={item.id} className="draw-overlay" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={(item.points||[]).map(p=>`${p.x*100},${p.y*100}`).join(" ")} fill="none" stroke={item.color} strokeWidth={Math.max(0.4,item.stroke)} vectorEffect="non-scaling-stroke"/></svg>;
    return null;
  };

  if (!pdf) return <div className="loading-screen"><div className="spinner"/><p>Opening your PDF…</p></div>;

  return (
    <div className="editor-shell">
      <header className="editor-header">
        <button className="ghost-btn" onClick={onBack}><ArrowLeft size={17}/><span className="hide-mobile">Home</span></button>
        <div className="editor-title"><FilePlus2 size={17}/><strong>{file.name}</strong><small>{pdf.numPages} pages · {formatBytes(file.size)}</small></div>
        <div className="editor-actions">
          <button className="icon-btn" onClick={undo} disabled={!history.length} title="Undo"><Undo2/></button>
          <button className="icon-btn" onClick={redo} disabled={!future.length} title="Redo"><Redo2/></button>
          <button className="export-btn" onClick={exportPdf} disabled={busy}><Download size={17}/>{busy?"Exporting…":"Export PDF"}</button>
        </div>
      </header>

      <div className="editor-layout">
        <aside className="editor-sidebar">
          <div className="tool-label">TOOLS</div>
          {TOOLS.map(([id,label,Icon])=><button key={id} className={`editor-tool ${tool===id?"active":""}`} onClick={()=>id==="image"?imageInputRef.current?.click():setTool(id)}><Icon/><span>{label}</span></button>)}
          <input ref={imageInputRef} hidden type="file" accept="image/*" onChange={(e)=>{
            const f=e.target.files?.[0]; if(!f)return;
            const reader=new FileReader();
            reader.onload=()=>addOverlay(createOverlay("image",{src:reader.result,x:.2,y:.2,width:.25,height:.2}));
            reader.readAsDataURL(f);
          }}/>
          <div className="sidebar-divider"/>
          <button className="editor-tool" onClick={rotateCurrent}><RotateCw/><span>Rotate</span></button>
          <button className="editor-tool danger" onClick={removeSelected} disabled={!selected}><Trash2/><span>Delete</span></button>
        </aside>

        <section className="editor-center">
          <div className="canvas-toolbar">
            <div className="page-nav">
              <button className="icon-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft/></button>
              <span>{page} / {pdf.numPages}</span>
              <button className="icon-btn" disabled={page===pdf.numPages} onClick={()=>setPage(p=>p+1)}><ChevronRight/></button>
            </div>
            <div className="zoom"><button className="icon-btn" onClick={()=>setScale(s=>Math.max(.55,s-.1))}><ZoomOut/></button><span>{Math.round(scale*100)}%</span><button className="icon-btn" onClick={()=>setScale(s=>Math.min(2,s+.1))}><ZoomIn/></button></div>
          </div>

          <div className="pdf-workspace">
            <div className="page-wrap" ref={pageWrapRef} style={{opacity:rendering?.7:1}}>
              <canvas ref={canvasRef} onClick={canvasClick} onPointerDown={onDrawStart} />
              <div className="overlay-layer">{pageOverlays.map(renderOverlay)}</div>
            </div>
          </div>
        </section>

        <aside className="properties">
          <div className="properties-title"><Settings2 size={17}/> Quick actions</div>
          <button className="property-action" onClick={()=>setTool("text")}><Type/> Add text</button>
          <button className="property-action" onClick={()=>setTool("highlight")}><Highlighter/> Highlight</button>
          <button className="property-action" onClick={()=>setTool("draw")}><PenLine/> Draw</button>
          <button className="property-action" onClick={()=>setTool("watermark")}><Droplets/> Watermark</button>
          <div className="properties-title metadata-title">Document</div>
          {["title","author","subject","keywords"].map(k=><label className="field" key={k}>{k}<input value={meta[k]||""} onChange={e=>setMeta(m=>({...m,[k]:e.target.value}))}/></label>)}
          <div className="privacy-note"><ShieldIcon/><span>Processing stays in this browser for the included tools.</span></div>
        </aside>
      </div>
    </div>
  );
}

function ShieldIcon(){ return <span className="shield-mini">✓</span>; }
