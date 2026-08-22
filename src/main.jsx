import React,{useEffect,useRef,useState}from"react";
import{createRoot}from"react-dom/client";
import{PDFDocument,StandardFonts,rgb}from"pdf-lib";
import*as pdfjsLib from"pdfjs-dist";
import"./style.css";
pdfjsLib.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.mjs",import.meta.url).toString();

const fonts={Helvetica:StandardFonts.Helvetica,Times:StandardFonts.TimesRoman,Courier:StandardFonts.Courier};
const uid=()=>Math.random().toString(36).slice(2)+Date.now();
function download(data,name,type="application/pdf"){const b=data instanceof Blob?data:new Blob([data],{type});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function Upload({onFile}){const ref=useRef();return <div className="drop" onClick={()=>ref.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onFile(e.dataTransfer.files[0])}}><input ref={ref} hidden type="file" accept="application/pdf" onChange={e=>{onFile(e.target.files[0]);e.target.value=""}}/><strong>＋ Upload PDF</strong><span>or drag & drop a PDF</span></div>}

function App(){
 const[file,setFile]=useState(null),[pdf,setPdf]=useState(null),[page,setPage]=useState(1),[zoom,setZoom]=useState(1),[editing,setEditing]=useState(false),[mode,setMode]=useState("edit"),[objects,setObjects]=useState([]),[selected,setSelected]=useState(null),[draft,setDraft]=useState(""),[msg,setMsg]=useState("");
 const bg=useRef(),pageRef=useRef(),history=useRef([]),redoStack=useRef([]);

 async function open(f){if(!f)return;try{const data=new Uint8Array(await f.arrayBuffer());const p=await pdfjsLib.getDocument({data}).promise;setFile(f);setPdf(p);setPage(1);setObjects([]);setSelected(null);setEditing(true);setMsg("Click any text on the page to edit it.");}catch(e){setMsg("Could not open this PDF.")}}
 useEffect(()=>{if(pdf)render()},[pdf,page,zoom]);
 async function render(){
   const p=await pdf.getPage(page);
   const scale=1.35*zoom, v=p.getViewport({scale});
   const c=bg.current;c.width=v.width;c.height=v.height;
   await p.render({canvasContext:c.getContext("2d"),viewport:v}).promise;
   const tc=await p.getTextContent();
   const old=objects.filter(o=>o.page===page);
   const base=[];
   for(let i=0;i<tc.items.length;i++){
     const it=tc.items[i];if(!it.str)continue;
     const tx=pdfjsLib.Util.transform(v.transform,it.transform);
     const fs=Math.max(7,Math.hypot(tx[0],tx[1]));
     const x=tx[4],y=tx[5]-fs;
     base.push({id:"src-"+page+"-"+i,page,sourceIndex:i,kind:"text",x,y,w:Math.max(8,it.width*scale),h:fs*1.25,text:it.str,original:it.str,size:fs,font:"Arial",color:"#201c27",bold:false,italic:false});
   }
   // Keep user objects and merge source text. Source objects are rebuilt per page to match the rendered PDF.
   setObjects(prev=>[...prev.filter(o=>o.page!==page||o.sourceIndex==null),...base]);
 }
 function snapshot(){history.current.push(JSON.stringify(objects));if(history.current.length>50)history.current.shift();redoStack.current=[]}
 function update(id,patch){snapshot();setObjects(a=>a.map(o=>o.id===id?{...o,...patch}:o))}
 function addText(e){if(mode!=="add")return;const r=pageRef.current.getBoundingClientRect();const x=(e.clientX-r.left),y=(e.clientY-r.top);snapshot();const o={id:uid(),page,kind:"added",x,y,w:260,h:40,text:"Type here",size:18,font:"Helvetica",color:"#25202e",bold:false,italic:false};setObjects(a=>[...a,o]);setSelected(o.id);setMode("edit")}
 function clickObj(e,o){e.stopPropagation();setSelected(o.id);if(o.kind==="text"){setDraft(o.text);setMsg("Text selected. Type directly into the box or use the editor panel.")}}
 function undo(){if(!history.current.length)return;redoStack.current.push(JSON.stringify(objects));setObjects(JSON.parse(history.current.pop()))}
 function redo(){if(!redoStack.current.length)return;history.current.push(JSON.stringify(objects));setObjects(JSON.parse(redoStack.current.pop()))}
 function selectedObj(){return objects.find(o=>o.id===selected)}
 async function exportPdf(){
   try{
    const d=await PDFDocument.load(await file.arrayBuffer()),ps=d.getPages();
    const embedded={};for(const[k,v]of Object.entries(fonts))embedded[k]=await d.embedFont(v);
    for(const o of objects){
      const p=ps[o.page-1];if(!p)continue;
      const pageWidth=bg.current.width,pageHeight=bg.current.height;
      const sx=p.getWidth()/pageWidth,sy=p.getHeight()/pageHeight;
      if(o.kind==="text"||o.kind==="added"){
        // Cover original text area, then draw edited text at the same position.
        if(o.kind==="text")p.drawRectangle({x:o.x*sx-2,y:p.getHeight()-(o.y+o.h)*sy-2,width:o.w*sx+4,height:o.h*sy+4,color:rgb(1,1,1)});
        p.drawText(o.text||"",{x:o.x*sx,y:p.getHeight()-(o.y+o.h)*sy+2,size:Math.max(6,o.size*sx),font:embedded[o.font]||embedded.Helvetica,color:hex(o.color)});
      }else if(o.kind==="whiteout")p.drawRectangle({x:o.x*sx,y:p.getHeight()-(o.y+o.h)*sy,width:o.w*sx,height:o.h*sy,color:rgb(1,1,1)});
      else if(o.kind==="highlight")p.drawRectangle({x:o.x*sx,y:p.getHeight()-(o.y+o.h)*sy,width:o.w*sx,height:o.h*sy,color:rgb(1,.88,.1),opacity:.35});
      else if(o.kind==="rect")p.drawRectangle({x:o.x*sx,y:p.getHeight()-(o.y+o.h)*sy,width:o.w*sx,height:o.h*sy,color:rgb(1,1,1),opacity:0,borderColor:hex(o.color),borderWidth:2});
    }
    download(await d.save(),"chanvika-edited.pdf");setMsg("✓ PDF exported");
   }catch(e){console.error(e);setMsg("Export failed.")}}
 function hex(h){h=h.replace("#","");return rgb(parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255)}
 const sel=selectedObj();
 if(!editing)return <main className="page"><span className="eyebrow">CHANVIKA PDF EDITOR</span><h1>Make a PDF feel like a document.</h1><p>Upload a PDF and edit its detected text directly on the page. No AI API. Browser-first.</p><Upload onFile={open}/><div className="note">Native text PDFs work best. Scanned PDFs need OCR because their text is stored as pixels.</div></main>;
 return <main className="editorPage">
  <header className="editHead"><button onClick={()=>setEditing(false)}>←</button><b>Chanvika PDF Editor</b><span>{file?.name}</span><button className="export" onClick={exportPdf}>Export PDF</button></header>
  <div className="editLayout">
   <aside className="tools">
    <button className={mode==="edit"?"on":""} onClick={()=>setMode("edit")}>↖<small>Edit</small></button>
    <button className={mode==="add"?"on":""} onClick={()=>setMode("add")}>T<small>Add Text</small></button>
    <button className={mode==="whiteout"?"on":""} onClick={()=>setMode("whiteout")}>□<small>Whiteout</small></button>
    <button onClick={undo}>↶<small>Undo</small></button><button onClick={redo}>↷<small>Redo</small></button>
   </aside>
   <section className="canvasPanel">
    <div className="bar"><button onClick={()=>setPage(Math.max(1,page-1))}>‹</button><b>Page {page} / {pdf.numPages}</b><button onClick={()=>setPage(Math.min(pdf.numPages,page+1))}>›</button><i/><button onClick={()=>setZoom(Math.max(.6,zoom-.1))}>−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(Math.min(2,zoom+.1))}>＋</button></div>
    <div className="paperArea"><div ref={pageRef} className={"paper "+(mode==="add"?"addMode":"")} onClick={addText}><canvas ref={bg}/>
      <div className="documentLayer">{objects.filter(o=>o.page===page).map(o=><div key={o.id} className={"docObject "+(selected===o.id?"selected":"")} style={{left:o.x,top:o.y,width:Math.max(o.w,8),minHeight:o.h,fontSize:o.size, color:o.color,fontFamily:o.font,fontWeight:o.bold?"700":"400",fontStyle:o.italic?"italic":"normal"}} onClick={e=>clickObj(e,o)}>
       {selected===o.id&&mode==="edit"?(<textarea autoFocus value={o.text} onChange={e=>setObjects(a=>a.map(q=>q.id===o.id?{...q,text:e.target.value}:q))} onKeyDown={e=>{if(e.key==="Escape"){e.currentTarget.blur();setSelected(null)}}}/>):o.text}
      </div>)}</div>
      {mode==="whiteout"&&<div className="toolHint">Whiteout mode: click the area you want to cover.</div>}
    </div></div>
    <div className="status">{msg||"Edit mode: click any text. Add Text mode: click anywhere on the page."}</div>
   </section>
   <aside className="inspector"><h3>{sel?"Text properties":"Document editor"}</h3>{sel?<><label>Text</label><textarea value={sel.text} onChange={e=>update(sel.id,{text:e.target.value})}/><label>Font</label><select value={sel.font} onChange={e=>update(sel.id,{font:e.target.value})}><option>Helvetica</option><option>Times</option><option>Courier</option></select><label>Size</label><input type="range" min="8" max="60" value={sel.size} onChange={e=>update(sel.id,{size:+e.target.value})}/><label>Color</label><input type="color" value={sel.color} onChange={e=>update(sel.id,{color:e.target.value})}/><div className="fmt"><button className={sel.bold?"active":""} onClick={()=>update(sel.id,{bold:!sel.bold})}>B</button><button className={sel.italic?"active":""} onClick={()=>update(sel.id,{italic:!sel.italic})}>I</button></div></>:<><p><b>Edit mode:</b> click any detected PDF text.</p><p>The clicked text becomes a real HTML editable box, so you can type, delete and replace characters directly.</p><p><b>Add Text:</b> choose Add Text and click anywhere on the page.</p><p className="warning">Exact original embedded-font preservation is not guaranteed across every PDF.</p></>}</aside>
  </div>
 </main>
}
createRoot(document.getElementById("root")).render(<App/>);
