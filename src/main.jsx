import React,{useEffect,useRef,useState}from"react";
import{createRoot}from"react-dom/client";
import{PDFDocument,StandardFonts,rgb}from"pdf-lib";
import*as pdfjsLib from"pdfjs-dist";
import"./style.css";
pdfjsLib.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.mjs",import.meta.url).toString();

function Upload({onFile}){const r=useRef();return <div className="upload" onClick={()=>r.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onFile(e.dataTransfer.files[0])}}><input hidden ref={r} type="file" accept="application/pdf" onChange={e=>onFile(e.target.files[0])}/><b>Upload PDF</b><span>Core export test</span></div>}
function App(){
 const[file,setFile]=useState(null),[pdf,setPdf]=useState(null),[page,setPage]=useState(1),[scale,setScale]=useState(1.3),[runs,setRuns]=useState([]),[sel,setSel]=useState(null),[value,setValue]=useState(""),[status,setStatus]=useState("");
 const canvas=useRef();
 async function open(f){if(!f)return;try{const d=new Uint8Array(await f.arrayBuffer()),p=await pdfjsLib.getDocument({data:d}).promise;setFile(f);setPdf(p);setPage(1);setStatus("Click text, edit or delete it, then export.");}catch(e){setStatus("Could not open PDF.")}}
 useEffect(()=>{if(pdf)load()},[pdf,page,scale]);
 async function load(){
  const p=await pdf.getPage(page),v=p.getViewport({scale}),c=canvas.current;c.width=v.width;c.height=v.height;
  await p.render({canvasContext:c.getContext("2d"),viewport:v}).promise;
  const tc=await p.getTextContent(),a=[];
  tc.items.forEach((it,i)=>{if(!it.str)return;const t=pdfjsLib.Util.transform(v.transform,it.transform),size=Math.max(7,Math.hypot(t[0],t[1]));a.push({id:`${page}-${i}`,page,index:i,original:it.str,text:it.str,x:t[4],y:t[5]-size,w:Math.max(10,it.width*scale),h:size*1.35,size})});
  setRuns(a);
 }
 const current=runs.find(x=>x.id===sel);
 function edit(v){setValue(v);if(current)setRuns(a=>a.map(x=>x.id===current.id?{...x,text:v,changed:v!==x.original}:x))}
 function select(r){setSel(r.id);setValue(r.text);setStatus("Selected: "+r.original)}
 async function exportPdf(){
  if(!file)return;
  setStatus("Generating edited PDF…");
  try{
   const d=await PDFDocument.load(await file.arrayBuffer());
   const font=await d.embedFont(StandardFonts.Helvetica),pages=d.getPages();
   // Only changed runs are modified. For every changed run, paint a precise white patch
   // over the original run and then draw the new value. Unchanged PDF content is untouched.
   for(const r of runs){
    if(!r.changed)continue;
    const pg=pages[r.page-1];if(!pg)continue;
    const sx=pg.getWidth()/canvas.current.width,sy=pg.getHeight()/canvas.current.height;
    const x=r.x*sx,y=pg.getHeight()-(r.y+r.h)*sy,w=r.w*sx,h=r.h*sy;
    pg.drawRectangle({x:x-1,y:y-1,width:w+2,height:h+2,color:rgb(1,1,1),opacity:1});
    if(r.text.trim())pg.drawText(r.text,{x:x,y:y+Math.max(1,h*.12),size:Math.max(6,r.size*sx*.88),font,color:rgb(.08,.07,.1)});
   }
   const bytes=await d.save();
   const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));a.download="chanvika-edited.pdf";a.click();
   setStatus("✓ Exported. Re-open the downloaded PDF to verify the change.");
  }catch(e){console.error(e);setStatus("Export failed: "+e.message)}
 }
 if(!pdf)return <main><section className="hero"><div className="brand">CHANVIKA PDF EDITOR</div><h1>Delete & Replace Export Test</h1><p>This build focuses on one thing: changes must appear in the exported PDF.</p><Upload onFile={open}/><small>Use a normal text-based PDF.</small></section></main>;
 return <main className="app"><header><button onClick={()=>setPdf(null)}>←</button><b>Chanvika — Export Fix v14</b><span>{file?.name}</span><button className="export" onClick={exportPdf}>Export PDF</button></header>
 <div className="bar"><button onClick={()=>setPage(Math.max(1,page-1))}>‹</button><b>Page {page}/{pdf.numPages}</b><button onClick={()=>setPage(Math.min(pdf.numPages,page+1))}>›</button><i/><button onClick={()=>setScale(Math.max(.8,scale-.1))}>−</button><span>{Math.round(scale*100)}%</span><button onClick={()=>setScale(Math.min(2,scale+.1))}>＋</button></div>
 <div className="workspace"><div className="paper"><canvas ref={canvas}/><div className="clickMap">{runs.map(r=><button key={r.id} className={"hit "+(sel===r.id?"selected":"")} style={{left:r.x,top:r.y,width:r.w,height:r.h}} onClick={()=>select(r)} aria-label={"Edit "+r.original}/>)}</div></div></div>
 <aside className="editor">{current?<><h3>Edit original PDF text</h3><div className="original">Original<br/><b>{current.original}</b></div><label>Replacement text</label><textarea autoFocus value={value} onChange={e=>edit(e.target.value)}/><div className="actions"><button onClick={()=>edit("")}>Delete text</button><button onClick={()=>{edit(current.original);setStatus("Reverted.")}}>Revert</button></div><p>Delete makes the replacement empty. Export then covers only this changed original text region.</p></>:<><h3>Select text</h3><p>{status}</p></>}</aside>
 <footer>{status}</footer></main>
}
createRoot(document.getElementById("root")).render(<App/>);
