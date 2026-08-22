import React,{useEffect,useRef,useState}from"react";
import{createRoot}from"react-dom/client";
import{PDFDocument,StandardFonts,rgb}from"pdf-lib";
import*as pdfjsLib from"pdfjs-dist";
import"./style.css";
pdfjsLib.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.mjs",import.meta.url).toString();

const embedded={Helvetica:StandardFonts.Helvetica,Times:StandardFonts.TimesRoman,Courier:StandardFonts.Courier};
const uid=()=>Math.random().toString(36).slice(2)+Date.now();
const hex=h=>{h=h.replace("#","");return rgb(parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255)};
function download(data,name){const a=document.createElement("a"),u=URL.createObjectURL(new Blob([data],{type:"application/pdf"}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function Upload({onFile}){const r=useRef();return <div className="drop" onClick={()=>r.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onFile(e.dataTransfer.files[0])}}><input ref={r} hidden type="file" accept="application/pdf" onChange={e=>onFile(e.target.files[0])}/><b>＋ Upload PDF</b><span>Drag & drop or choose a PDF</span></div>}

function App(){
 const[file,setFile]=useState(),[pdf,setPdf]=useState(),[page,setPage]=useState(1),[zoom,setZoom]=useState(1),[items,setItems]=useState([]),[selected,setSelected]=useState(null),[editing,setEditing]=useState(false),[mode,setMode]=useState("edit"),[msg,setMsg]=useState("");
 const bg=useRef(),layer=useRef(),paper=useRef(),history=useRef([]),future=useRef([]);
 async function open(f){if(!f)return;try{const data=new Uint8Array(await f.arrayBuffer()),p=await pdfjsLib.getDocument({data}).promise;setFile(f);setPdf(p);setPage(1);setItems([]);setSelected(null);setEditing(true);setMsg("Click an original PDF text item to edit it.");}catch(e){setMsg("Could not open PDF.")}}
 useEffect(()=>{if(pdf)loadPage()},[pdf,page,zoom]);
 async function loadPage(){
  const p=await pdf.getPage(page),v=p.getViewport({scale:1.4*zoom}),c=bg.current;
  c.width=v.width;c.height=v.height;await p.render({canvasContext:c.getContext("2d"),viewport:v}).promise;
  const tc=await p.getTextContent({includeMarkedContent:false}),newItems=[];
  for(let i=0;i<tc.items.length;i++){
   const it=tc.items[i];if(!it.str.trim())continue;
   const t=pdfjsLib.Util.transform(v.transform,it.transform),fs=Math.max(7,Math.hypot(t[0],t[1]));
   newItems.push({id:`${page}:${i}`,page,index:i,kind:"original",x:t[4],y:t[5]-fs,w:Math.max(it.width*1.4*zoom,fs*.6),h:fs*1.35,text:it.str,original:it.str,size:fs,font:"Helvetica",color:"#201b25"});
  }
  setItems(prev=>[...prev.filter(x=>x.page!==page),...newItems]);
 }
 function snap(){history.current.push(JSON.stringify(items));future.current=[]}
 function update(id,patch){snap();setItems(a=>a.map(o=>o.id===id?{...o,...patch}:o))}
 function select(o,e){e.stopPropagation();if(mode!=="edit")return;setSelected(o.id);setMsg("Editing original PDF text.");}
 function addText(e){if(mode!=="add")return;const r=paper.current.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;snap();const o={id:uid(),page,kind:"added",x,y,w:180,h:30,text:"Type here",original:"",size:18,font:"Helvetica",color:"#201b25"};setItems(a=>[...a,o]);setSelected(o.id);setMode("edit")}
 function undo(){if(!history.current.length)return;future.current.push(JSON.stringify(items));setItems(JSON.parse(history.current.pop()))}
 function redo(){if(!future.current.length)return;history.current.push(JSON.stringify(items));setItems(JSON.parse(future.current.pop()))}
 async function exportPdf(){try{
  const d=await PDFDocument.load(await file.arrayBuffer()),ps=d.getPages();
  const fs={};for(const[k,v]of Object.entries(embedded))fs[k]=await d.embedFont(v);
  // Cover each original text run and redraw ONLY its current edited value. No duplicate overlay is exported.
  for(const o of items){const p=ps[o.page-1];if(!p)continue;const sx=p.getWidth()/bg.current.width,sy=p.getHeight()/bg.current.height;
   if(o.kind==="original"){p.drawRectangle({x:o.x*sx-1,y:p.getHeight()-(o.y+o.h)*sy-1,width:o.w*sx+2,height:o.h*sy+2,color:rgb(1,1,1)});p.drawText(o.text,{x:o.x*sx,y:p.getHeight()-(o.y+o.h)*sy+1,size:o.size*sx,font:fs[o.font]||fs.Helvetica,color:hex(o.color)})}
   if(o.kind==="added")p.drawText(o.text,{x:o.x*sx,y:p.getHeight()-(o.y+o.h)*sy,size:o.size*sx,font:fs[o.font]||fs.Helvetica,color:hex(o.color)})
  }
  download(await d.save(),"chanvika-edited.pdf");setMsg("✓ Export complete");
 }catch(e){console.error(e);setMsg("Export failed.")}}
 if(!editing)return <main className="home"><div className="brand">CHANVIKA <span>PDF</span></div><h1>PDF editing that feels like a document.</h1><p>Click the original PDF text, edit it directly, and export. No AI API.</p><Upload onFile={open}/><small>Best with text-based PDFs. Scanned PDFs need OCR.</small></main>;
 const sel=items.find(x=>x.id===selected);
 return <main className="app"><header><button onClick={()=>setEditing(false)}>←</button><b>Chanvika PDF Editor</b><span>{file?.name}</span><button className="export" onClick={exportPdf}>Export PDF</button></header>
 <div className="body"><aside className="toolbar"><button className={mode==="edit"?"active":""} onClick={()=>setMode("edit")}>↖<small>Edit</small></button><button className={mode==="add"?"active":""} onClick={()=>setMode("add")}>T<small>Add Text</small></button><button onClick={undo}>↶<small>Undo</small></button><button onClick={redo}>↷<small>Redo</small></button></aside>
 <section className="work"><div className="nav"><button onClick={()=>setPage(Math.max(1,page-1))}>‹</button><b>Page {page} / {pdf.numPages}</b><button onClick={()=>setPage(Math.min(pdf.numPages,page+1))}>›</button><i/><button onClick={()=>setZoom(Math.max(.6,zoom-.1))}>−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(Math.min(2,zoom+.1))}>＋</button></div>
 <div className="stage"><div ref={paper} className="paper" onClick={addText}><canvas ref={bg}/><div ref={layer} className="originalLayer">{items.filter(o=>o.page===page).map(o=><div key={o.id} className={"originalText "+(selected===o.id?"selected":"")} style={{left:o.x,top:o.y,width:o.w,minHeight:o.h,fontSize:o.size,color:o.color,fontFamily:o.font}} onClick={e=>select(o,e)}>
 {selected===o.id?<textarea autoFocus value={o.text} onChange={e=>setItems(a=>a.map(q=>q.id===o.id?{...q,text:e.target.value}:q))} onFocus={e=>e.currentTarget.select()} />:<span>{o.text}</span>}
 </div>)}</div></div></div><div className="status">{msg}</div></section>
 <aside className="panel"><h3>{sel?"Edit original text":"PDF Editor"}</h3>{sel?<><label>Text</label><textarea value={sel.text} onChange={e=>update(sel.id,{text:e.target.value})}/><label>Font</label><select value={sel.font} onChange={e=>update(sel.id,{font:e.target.value})}><option>Helvetica</option><option>Times</option><option>Courier</option></select><label>Size</label><input type="number" min="6" max="72" value={sel.size} onChange={e=>update(sel.id,{size:+e.target.value})}/><label>Color</label><input type="color" value={sel.color} onChange={e=>update(sel.id,{color:e.target.value})}/><p className="tip">This is the original PDF text item. The text is edited in place; no duplicate text layer is shown.</p></>:<><p><b>Edit mode:</b> click directly on any visible text.</p><p>The clicked original text becomes the only editable text object.</p><p>Use <b>Add Text</b> for new content.</p></>}</aside></div></main>
}
createRoot(document.getElementById("root")).render(<App/>);
