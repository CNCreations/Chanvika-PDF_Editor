import React,{useEffect,useRef,useState}from"react";
import{createRoot}from"react-dom/client";
import{PDFDocument,StandardFonts,rgb}from"pdf-lib";
import*as pdfjsLib from"pdfjs-dist";
import"./style.css";
pdfjsLib.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.mjs",import.meta.url).toString();

const uid=()=>Math.random().toString(36).slice(2)+Date.now();
const fonts={Helvetica:StandardFonts.Helvetica,Times:StandardFonts.TimesRoman,Courier:StandardFonts.Courier};
const hex=h=>{h=h.replace("#","");return rgb(parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255)};
function savePDF(bytes){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));a.download="chanvika-edited.pdf";a.click()}
function Upload({onFile}){const r=useRef();return <div className="upload" onClick={()=>r.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onFile(e.dataTransfer.files[0])}}><input ref={r} hidden type="file" accept=".pdf,application/pdf" onChange={e=>onFile(e.target.files[0])}/><b>Upload a PDF</b><span>or drag & drop here</span></div>}

function App(){
 const[file,setFile]=useState(null),[doc,setDoc]=useState(null),[page,setPage]=useState(1),[scale,setScale]=useState(1.35),[runs,setRuns]=useState([]),[selected,setSelected]=useState(null),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 const canvas=useRef(), pageBox=useRef();

 async function openPDF(f){
  if(!f)return;setBusy(true);setStatus("Reading PDF text…");
  try{const bytes=new Uint8Array(await f.arrayBuffer());const p=await pdfjsLib.getDocument({data:bytes}).promise;setFile(f);setDoc(p);setPage(1);setSelected(null);setStatus("Click any detected original text to edit it.");}
  catch(e){console.error(e);setStatus("Could not read this PDF.")}finally{setBusy(false)}
 }
 useEffect(()=>{if(doc)load()},[doc,page,scale]);
 async function load(){
  const p=await doc.getPage(page),v=p.getViewport({scale});
  const c=canvas.current;c.width=v.width;c.height=v.height;await p.render({canvasContext:c.getContext("2d"),viewport:v}).promise;
  const tc=await p.getTextContent();const next=[];
  tc.items.forEach((it,i)=>{
   if(!it.str)return;
   const tr=pdfjsLib.Util.transform(v.transform,it.transform);
   const size=Math.max(7,Math.hypot(tr[0],tr[1]));
   next.push({id:`p${page}-${i}`,page,index:i,text:it.str,original:it.str,x:tr[4],y:tr[5]-size,w:Math.max(it.width*scale,10),h:size*1.35,size});
  });
  setRuns(next);
 }
 function change(id,text){setRuns(a=>a.map(r=>r.id===id?{...r,text}:r))}
 async function exportPDF(){
  if(!file)return;setBusy(true);setStatus("Creating edited PDF…");
  try{
   const d=await PDFDocument.load(await file.arrayBuffer());
   const f=await d.embedFont(StandardFonts.Helvetica);
   const p=d.getPages();
   // Whiteout only the exact original text-run rectangles and redraw the edited value.
   // The browser editor itself displays only ONE text representation: the editable run.
   for(const r of runs){
    const pg=p[r.page-1];if(!pg)continue;
    const sx=pg.getWidth()/canvas.current.width, sy=pg.getHeight()/canvas.current.height;
    pg.drawRectangle({x:r.x*sx-1,y:pg.getHeight()-(r.y+r.h)*sy-1,width:r.w*sx+2,height:r.h*sy+2,color:rgb(1,1,1)});
    if(r.text)pg.drawText(r.text,{x:r.x*sx,y:pg.getHeight()-(r.y+r.h)*sy+1,size:r.size*sx,font:f,color:rgb(.12,.1,.14)});
   }
   savePDF(await d.save());setStatus("✓ Exported edited PDF");
  }catch(e){console.error(e);setStatus("Export failed.")}finally{setBusy(false)}
 }
 if(!doc)return <main><div className="hero"><div className="logo">CHANVIKA PDF</div><h1>Actual PDF text editing</h1><p>This prototype tests the core feature first: click the original PDF text, edit it, export it.</p><Upload onFile={openPDF}/><small>Native text PDFs only for this prototype. Scanned PDFs require OCR.</small></div></main>;
 return <main className="editor"><header><button onClick={()=>setDoc(null)}>←</button><strong>Chanvika PDF Editor — Prototype</strong><span>{file?.name}</span><button className="export" onClick={exportPDF} disabled={busy}>Export PDF</button></header>
 <div className="toolbar"><button onClick={()=>setPage(Math.max(1,page-1))}>‹</button><b>Page {page} / {doc.numPages}</b><button onClick={()=>setPage(Math.min(doc.numPages,page+1))}>›</button><i/><button onClick={()=>setScale(Math.max(.8,scale-.1))}>−</button><span>{Math.round(scale*100)}%</span><button onClick={()=>setScale(Math.min(2.2,scale+.1))}>＋</button></div>
 <section className="workspace"><div className="paper" ref={pageBox}><canvas ref={canvas}/><div className="textLayer">{runs.map(r=><div key={r.id} className={"run "+(selected===r.id?"selected":"")} style={{left:r.x,top:r.y,width:r.w,minHeight:r.h,fontSize:r.size}} onClick={e=>{e.stopPropagation();setSelected(r.id)}}>{selected===r.id?<textarea autoFocus value={r.text} onChange={e=>change(r.id,e.target.value)} onBlur={()=>setSelected(null)}/>:r.text}</div>)}</div></div></section>
 <footer>{selected?<span>Editing original PDF text. Type, delete or replace it.</span>:<span>{status}</span>}</footer>
 </main>
}
createRoot(document.getElementById("root")).render(<App/>);
