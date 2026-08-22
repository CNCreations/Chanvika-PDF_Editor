import React,{useEffect,useRef,useState}from"react";
import{createRoot}from"react-dom/client";
import{PDFDocument,StandardFonts,rgb}from"pdf-lib";
import*as pdfjsLib from"pdfjs-dist";
import"./style.css";
pdfjsLib.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.mjs",import.meta.url).toString();

const uid=()=>Math.random().toString(36).slice(2);
const R=(n)=>Math.round(n*1000)/1000;
function Upload({onFile}){const r=useRef();return <div className="upload" onClick={()=>r.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onFile(e.dataTransfer.files[0])}}><input hidden ref={r} type="file" accept="application/pdf" onChange={e=>onFile(e.target.files[0])}/><b>Upload PDF</b><span>Core editor prototype</span></div>}

function App(){
 const[file,setFile]=useState(null),[pdf,setPdf]=useState(null),[page,setPage]=useState(1),[scale,setScale]=useState(1.3),[runs,setRuns]=useState([]),[sel,setSel]=useState(null),[value,setValue]=useState(""),[status,setStatus]=useState("");
 const canvas=useRef();
 async function open(f){if(!f)return;try{const d=new Uint8Array(await f.arrayBuffer()),p=await pdfjsLib.getDocument({data:d}).promise;setFile(f);setPdf(p);setPage(1);setStatus("Click a text run in the PDF.");}catch(e){setStatus("PDF could not be opened.")}}
 useEffect(()=>{if(pdf)readPage()},[pdf,page,scale]);
 async function readPage(){
  const p=await pdf.getPage(page),v=p.getViewport({scale});
  const c=canvas.current;c.width=v.width;c.height=v.height;
  await p.render({canvasContext:c.getContext("2d"),viewport:v}).promise;
  const tc=await p.getTextContent();const a=[];
  tc.items.forEach((it,i)=>{if(!it.str)return;const t=pdfjsLib.Util.transform(v.transform,it.transform),size=Math.max(7,Math.hypot(t[0],t[1]));a.push({id:`${page}-${i}`,page,index:i,text:it.str,x:t[4],y:t[5]-size,w:Math.max(10,it.width*scale),h:size*1.25,size})});
  setRuns(a);
 }
 // Important: no HTML text layer is rendered. Click targets are transparent buttons,
 // so the original PDF canvas text remains the only visible text.
 async function exportPdf(){
  if(!file)return;setStatus("Writing edited PDF…");
  try{
   const d=await PDFDocument.load(await file.arrayBuffer());
   const font=await d.embedFont(StandardFonts.Helvetica);
   const pages=d.getPages();
   for(const r of runs){
    if(r.text===r.original||r.text===undefined)continue;
    const pg=pages[r.page-1];if(!pg)continue;
    const sx=pg.getWidth()/canvas.current.width,sy=pg.getHeight()/canvas.current.height;
    pg.drawRectangle({x:r.x*sx-1,y:pg.getHeight()-(r.y+r.h)*sy-1,width:r.w*sx+2,height:r.h*sy+2,color:rgb(1,1,1)});
    if(r.text)pg.drawText(r.text,{x:r.x*sx,y:pg.getHeight()-(r.y+r.h)*sy+1,size:r.size*sx,font,color:rgb(.12,.1,.14)});
   }
   const bytes=await d.save(),a=document.createElement("a");a.href=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));a.download="chanvika-edited.pdf";a.click();setStatus("✓ Export complete");
  }catch(e){console.error(e);setStatus("Export failed.")}}
 if(!pdf)return <main><section className="hero"><div className="brand">CHANVIKA PDF EDITOR</div><h1>Original PDF text editing — core test</h1><p>No text overlay is rendered. The PDF canvas remains the visual document.</p><Upload onFile={open}/><small>Use a normal text-based PDF for this test.</small></section></main>;
 const current=runs.find(r=>r.id===sel);
 return <main className="app"><header><button onClick={()=>setPdf(null)}>←</button><b>Content-Stream Core</b><span>{file?.name}</span><button className="export" onClick={exportPdf}>Export PDF</button></header>
 <div className="bar"><button onClick={()=>setPage(Math.max(1,page-1))}>‹</button><b>Page {page}/{pdf.numPages}</b><button onClick={()=>setPage(Math.min(pdf.numPages,page+1))}>›</button><i/><button onClick={()=>setScale(Math.max(.8,scale-.1))}>−</button><span>{Math.round(scale*100)}%</span><button onClick={()=>setScale(Math.min(2,scale+.1))}>＋</button></div>
 <div className="workspace"><div className="paper"><canvas ref={canvas}/><div className="clickMap">{runs.map(r=><button key={r.id} title={r.text} className={"hit "+(sel===r.id?"selected":"")} style={{left:r.x,top:r.y,width:r.w,height:r.h}} onClick={()=>{setSel(r.id);setValue(r.text);setStatus("Original PDF text selected.")}} aria-label={"Edit "+r.text}/>)}</div></div></div>
 <aside className="editor">{current?<><h3>Edit selected PDF text</h3><div className="original">Original: <b>{current.original}</b></div><textarea autoFocus value={value} onChange={e=>{setValue(e.target.value);setRuns(a=>a.map(x=>x.id===current.id?{...x,text:e.target.value}:x))}}/><p>Only the PDF's selected region is changed on export. The page itself is not re-rendered as an HTML text layer.</p></>:<><h3>Click text</h3><p>{status}</p></>}</aside>
 <footer>{status}</footer></main>
}
createRoot(document.getElementById("root")).render(<App/>);
