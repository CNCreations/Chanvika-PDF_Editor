import React,{useEffect,useRef,useState}from"react";
import{createRoot}from"react-dom/client";
import{PDFDocument,StandardFonts,rgb}from"pdf-lib";
import*as pdfjsLib from"pdfjs-dist";
import"./style.css";
pdfjsLib.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.mjs",import.meta.url).toString();

const fonts={Helvetica:StandardFonts.Helvetica,Times:StandardFonts.TimesRoman,Courier:StandardFonts.Courier};
const uid=()=>Math.random().toString(36).slice(2)+Date.now();
function dl(data,name,type="application/pdf"){let b=data instanceof Blob?data:new Blob([data],{type});let a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function Drop({onFile}){let r=useRef();return <div className="drop" onClick={()=>r.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onFile([...e.dataTransfer.files])}}><input ref={r} hidden type="file" accept="application/pdf" onChange={e=>{onFile([...e.target.files]);e.target.value=""}}/><strong>＋ Upload PDF</strong><span>or drag & drop your PDF here</span></div>}

function Editor(){
 const[file,setFile]=useState(null),[doc,setDoc]=useState(null),[page,setPage]=useState(1),[scale,setScale]=useState(1),[items,setItems]=useState([]),[selected,setSelected]=useState(null),[tool,setTool]=useState("select"),[text,setText]=useState(""),[font,setFont]=useState("Helvetica"),[size,setSize]=useState(18),[color,setColor]=useState("#25202e"),[bold,setBold]=useState(false),[italic,setItalic]=useState(false),[editing,setEditing]=useState(false),[msg,setMsg]=useState(""),[sourceText,setSourceText]=useState([]);
 const bg=useRef(),ov=useRef(),textLayer=useRef(),drag=useRef(null),history=useRef([]),future=useRef([]);
 async function open(fs){let f=fs[0];if(!f)return;try{let data=new Uint8Array(await f.arrayBuffer()),p=await pdfjsLib.getDocument({data}).promise;setFile(f);setDoc(p);setPage(1);setItems([]);setSelected(null);setEditing(true);setMsg(`${f.name} • ${p.numPages} pages`)}catch(e){setMsg("Unable to open this PDF.")}}
 useEffect(()=>{if(doc)render()},[doc,page,scale]);
 useEffect(()=>paint(),[items,selected,scale]);
 async function render(){
   let p=await doc.getPage(page),v=p.getViewport({scale:1.35*scale}),c=bg.current;
   c.width=v.width;c.height=v.height;await p.render({canvasContext:c.getContext("2d"),viewport:v}).promise;
   ov.current.width=v.width;ov.current.height=v.height;
   await buildTextLayer(p,v);paint()
 }
 async function buildTextLayer(p,v){
   let tc=await p.getTextContent(),el=textLayer.current;el.innerHTML="";el.style.width=v.width+"px";el.style.height=v.height+"px";
   let arr=[];
   for(let i=0;i<tc.items.length;i++){
     let it=tc.items[i]; if(!it.str)continue;
     let tx=pdfjsLib.Util.transform(v.transform,it.transform),x=tx[4],y=tx[5],fs=Math.max(6,Math.hypot(tx[0],tx[1]));
     let span=document.createElement("span");span.textContent=it.str;span.dataset.i=i;
     span.style.left=x+"px";span.style.top=(y-fs)+"px";span.style.fontSize=fs+"px";span.style.fontFamily="sans-serif";
     span.style.transformOrigin="0 100%";span.style.transform=`rotate(${Math.atan2(tx[1],tx[0])}rad)`;span.style.lineHeight="1";
     span.title="Click to edit this PDF text";
     span.onclick=e=>{e.stopPropagation(); if(tool!=="select")return; let w=Math.max(10,span.getBoundingClientRect().width),h=fs*1.35; let r=el.getBoundingClientRect();let sx=el.offsetWidth/r.width, sy=el.offsetHeight/r.height;
       let o={id:uid(),page,kind:"source",x,y:y,w:w*sx,h,original:it.str,text:it.str,size:fs,color:"#25202e",font:"Helvetica"};
       setItems(a=>[...a.filter(q=>q.sourceIndex!==i),{...o,sourceIndex:i}]);setSelected(o.id);setText(it.str);setSize(Math.round(fs));setMsg("Existing PDF text selected — edit it on the right, then Export PDF.")
     };
     el.appendChild(span);arr.push({i,str:it.str,x,y,w,h:fs*1.35,size:fs}); 
   } setSourceText(arr)
 }
 function pos(e){let r=ov.current.getBoundingClientRect();return{x:(e.clientX-r.left)*(ov.current.width/r.width),y:(e.clientY-r.top)*(ov.current.height/r.height)}}
 function saveHist(){history.current.push(JSON.stringify(items));if(history.current.length>40)history.current.shift();future.current=[]}
 function paint(){let c=ov.current;if(!c)return;let g=c.getContext("2d");g.clearRect(0,0,c.width,c.height);
  for(let o of items.filter(x=>x.page===page)){g.save();
   if(o.kind==="text"||o.kind==="source"){g.fillStyle=o.color;g.font=`${o.bold?"bold ":""}${o.italic?"italic ":""}${o.size*scale}px ${o.font}`;g.fillText(o.text,o.x,o.y)}
   if(o.kind==="whiteout"||o.kind==="sourceCover"){g.fillStyle="#fff";g.fillRect(o.x,o.y,o.w,o.h)}
   if(o.kind==="highlight"){g.fillStyle="#ffe33d";g.globalAlpha=.35;g.fillRect(o.x,o.y,o.w,o.h)}
   if(o.kind==="rect"){g.strokeStyle=o.color;g.lineWidth=2;g.strokeRect(o.x,o.y,o.w,o.h)}
   if(o.kind==="draw"){g.strokeStyle=o.color;g.lineWidth=3;g.lineCap="round";g.beginPath();o.points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke()}
   g.restore();
   if(selected===o.id){let w=o.w||Math.max(100,(o.text?.length||4)*o.size*.55),h=o.h||o.size*1.5;g.strokeStyle="#7057ff";g.setLineDash([5,4]);g.strokeRect(o.x-5,o.y-h+5,w+10,h+10);g.setLineDash([])}
  }}
 function down(e){let p=pos(e);
  if(tool==="text"){if(!text.trim()){setMsg("Type text first.");return}saveHist();let o={id:uid(),page,kind:"text",x:p.x,y:p.y,text,font,size,color,bold,italic};setItems(a=>[...a,o]);setSelected(o.id);return}
  if(tool==="select"){let hits=items.filter(o=>o.page===page&&o.kind!=="source"&&((o.kind==="text"&&p.x>=o.x-8&&p.x<=o.x+Math.max(100,o.text.length*o.size*.55)&&p.y<=o.y+8&&p.y>=o.y-o.size*1.6)||(o.kind!=="text"&&p.x>=o.x&&p.x<=o.x+o.w&&p.y>=o.y&&p.y<=o.y+o.h)));let o=hits.at(-1);setSelected(o?.id||null);if(o)drag.current={id:o.id,x:p.x,y:p.y,ox:o.x,oy:o.y};return}
  if(["whiteout","highlight","rect"].includes(tool)){drag.current={mode:tool,x:p.x,y:p.y};return}
  if(tool==="draw"){saveHist();let o={id:uid(),page,kind:"draw",points:[p],color};setItems(a=>[...a,o]);drag.current={id:o.id}}
 }
 function move(e){if(!drag.current)return;let p=pos(e),d=drag.current;if(d.id){setItems(a=>a.map(o=>o.id===d.id&&o.kind==="draw"?{...o,points:[...o.points,p]}:o.id===d.id?{...o,x:d.ox+p.x-d.x,y:d.oy+p.y-d.y}:o))}else if(d.mode){let x=Math.min(d.x,p.x),y=Math.min(d.y,p.y),w=Math.abs(p.x-d.x),h=Math.abs(p.y-d.y);setItems(a=>[...a.filter(o=>o.id!=="draft"),{id:"draft",page,kind:d.mode==="whiteout"?"whiteout":d.mode==="highlight"?"highlight":"rect",x,y,w,h,color}])}}
 function up(){let d=drag.current;if(!d)return;if(d.mode){saveHist();setItems(a=>a.map(o=>o.id==="draft"?{...o,id:uid()}:o))}drag.current=null}
 function updateSelected(patch){saveHist();setItems(a=>a.map(o=>o.id===selected?{...o,...patch}:o))}
 function undo(){if(!history.current.length)return;future.current.push(JSON.stringify(items));setItems(JSON.parse(history.current.pop()))}
 function redo(){if(!future.current.length)return;history.current.push(JSON.stringify(items));setItems(JSON.parse(future.current.pop()))}
 async function exportPdf(){try{
   let d=await PDFDocument.load(await file.arrayBuffer()),ps=d.getPages(),emb={};for(let[k,v]of Object.entries(fonts))emb[k]=await d.embedFont(v);
   for(let o of items){let p=ps[o.page-1];if(!p)continue;let sx=p.getWidth()/ov.current.width,sy=p.getHeight()/ov.current.height;
    if(o.kind==="source"){p.drawRectangle({x:o.x*sx,y:p.getHeight()-(o.y+o.h)*sy,width:o.w*sx+3,height:o.h*sy+3,color:rgb(1,1,1)});p.drawText(o.text,{x:o.x*sx,y:p.getHeight()-(o.y+o.h)*sy+2,size:Math.max(6,o.size*sx),font:emb[o.font]||emb.Helvetica,color:hex(o.color)})}
    else if(o.kind==="text")p.drawText(o.text,{x:o.x*sx,y:p.getHeight()-o.y*sy,size:o.size*sx,font:emb[o.font]||emb.Helvetica,color:hex(o.color)});
    else if(o.kind==="whiteout")p.drawRectangle({x:o.x*sx,y:p.getHeight()-(o.y+o.h)*sy,width:o.w*sx,height:o.h*sy,color:rgb(1,1,1)});
    else if(o.kind==="highlight")p.drawRectangle({x:o.x*sx,y:p.getHeight()-(o.y+o.h)*sy,width:o.w*sx,height:o.h*sy,color:rgb(1,.88,.1),opacity:.35});
    else if(o.kind==="rect")p.drawRectangle({x:o.x*sx,y:p.getHeight()-(o.y+o.h)*sy,width:o.w*sx,height:o.h*sy,color:rgb(1,1,1),opacity:0,borderColor:hex(o.color),borderWidth:2});
    else if(o.kind==="draw")for(let i=1;i<o.points.length;i++){let a=o.points[i-1],b=o.points[i];p.drawLine({start:{x:a.x*sx,y:p.getHeight()-a.y*sy},end:{x:b.x*sx,y:p.getHeight()-b.y*sy},thickness:2,color:hex(o.color)})}
   }dl(await d.save(),"chanvika-edited.pdf");setMsg("✓ Exported edited PDF")}catch(e){console.error(e);setMsg("Export failed.")}}
 function hex(h){h=h.replace("#","");return rgb(parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255)}
 if(!editing)return <main className="page"><span className="eyebrow">WORD-STYLE PDF EDITOR</span><h1>Edit your PDF like a document.</h1><p>Upload a PDF, then <b>click existing text directly on the page</b> to select and edit it. Add, cover, format and export.</p><Drop onFile={open}/><div className="note">Native text PDFs work best. Scanned/image PDFs need OCR for direct text selection.</div></main>;
 let sel=items.find(o=>o.id===selected);
 return <main className="editorPage"><header className="editHead"><button onClick={()=>setEditing(false)}>←</button><b>Chanvika PDF Editor</b><span>{file?.name}</span><button onClick={exportPdf} className="export">Export PDF</button></header><div className="editLayout"><aside className="tools">{["select","text","whiteout","highlight","rect","draw"].map(x=><button className={tool===x?"on":""} onClick={()=>setTool(x)} key={x}>{x==="select"?"↖":x==="text"?"T":x==="whiteout"?"□":x==="highlight"?"▰":x==="rect"?"▭":"✎"}<small>{x==="select"?"Edit":x}</small></button>)}<hr/><button onClick={undo}>↶<small>Undo</small></button><button onClick={redo}>↷<small>Redo</small></button>{sel&&<button onClick={()=>{saveHist();setItems(a=>a.filter(o=>o.id!==selected));setSelected(null)}}>⌫<small>Delete</small></button>}</aside><section className="canvasPanel"><div className="bar"><button onClick={()=>setPage(Math.max(1,page-1))}>‹</button><b>Page {page} / {doc.numPages}</b><button onClick={()=>setPage(Math.min(doc.numPages,page+1))}>›</button><i/><button onClick={()=>setScale(Math.max(.6,scale-.1))}>−</button><span>{Math.round(scale*100)}%</span><button onClick={()=>setScale(Math.min(2,scale+.1))}>＋</button></div><div className="paperArea"><div className="paper"><canvas ref={bg}/><div ref={textLayer} className="textLayer"/><canvas ref={ov} className="overlay" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}/></div></div><div className="status">{msg||"Select tool: click any visible PDF text to edit it. Text tool adds new text."}</div></section><aside className="inspector"><h3>{sel?.kind==="source"?"Edit PDF Text":"Editing"}</h3>{tool==="text"||sel?.kind==="text"||sel?.kind==="source"?<><label>Text</label><textarea value={sel?.text??text} onChange={e=>sel?updateSelected({text:e.target.value}):setText(e.target.value)} placeholder="Type or edit text"/><label>Font</label><select value={sel?.font||font} onChange={e=>sel?updateSelected({font:e.target.value}):setFont(e.target.value)}><option>Helvetica</option><option>Times</option><option>Courier</option></select><label>Size</label><input type="range" min="8" max="60" value={sel?.size||size} onChange={e=>sel?updateSelected({size:+e.target.value}):setSize(+e.target.value)}/><div className="fmt"><button className={sel?.bold||bold?"active":""} onClick={()=>sel?updateSelected({bold:!sel.bold}):setBold(!bold)}>B</button><button className={sel?.italic||italic?"active":""} onClick={()=>sel?updateSelected({italic:!sel.italic}):setItalic(!italic)}>I</button></div><label>Color</label><input type="color" value={sel?.color||color} onChange={e=>sel?updateSelected({color:e.target.value}):setColor(e.target.value)}/>{sel?.kind==="source"&&<div className="warning">This text was detected inside the original PDF. On export, the original text area is covered and your edited text is placed in the same location. Exact embedded font matching varies by PDF.</div>}</>:<><h4>Direct PDF text editing</h4><p>1. Keep <b>Select / Edit</b> active.</p><p>2. Click visible text on the PDF.</p><p>3. Change it here.</p><p>4. Export PDF.</p><p>You can also use Whiteout + Text for content that isn't selectable text.</p></>}</aside></div></main>
}
function App(){useEffect(()=>navigator.serviceWorker?.register("./sw.js").catch(()=>{}),[]);return <Editor/>}
createRoot(document.getElementById("root")).render(<App/>);
