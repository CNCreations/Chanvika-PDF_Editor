import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import {PDFDocument,StandardFonts,rgb,degrees} from "pdf-lib";
import "./style.css";

const tools=[
["editor","PDF Editor","Edit, annotate and export PDFs","violet"],
["converter","PDF Converter","PDF to images and document-ready exports","pink"],
["merge","Merge PDF","Combine multiple PDFs","blue"],
["split","Split PDF","Extract selected pages","orange"],
["files","File → PDF","Images and supported files to PDF","green"],
["security","Security","Protect, inspect and clean PDFs","red"],
["doctor","PDF Doctor","Repair-friendly PDF checks and optimization","cyan"]
];

function AdGate({onContinue}){const [s,setS]=useState(5);useEffect(()=>{const t=setInterval(()=>setS(x=>x>0?x-1:0),1000);return()=>clearInterval(t)},[]);return <div className="adgate"><div className="adbox"><span>ADVERTISEMENT</span><div className="admock">Your ad can appear here</div>{s>0?<button disabled>Continue after {s}s</button>:<button onClick={onContinue}>Continue to PDF Editor</button>}</div></div>}

function Editor(){
 const [file,setFile]=useState(null),[pages,setPages]=useState([]),[text,setText]=useState(""),[gate,setGate]=useState(false),[msg,setMsg]=useState("");
 const input=useRef();
 async function load(f){if(!f)return;setFile(f);setMsg(`Loaded ${f.name}`);setPages([])}
 async function exportPdf(){if(!file)return;setGate(true)}
 async function realExport(){setGate(false);try{const bytes=await file.arrayBuffer();const pdf=await PDFDocument.load(bytes);const page=pdf.getPages()[0];if(text){const font=await pdf.embedFont(StandardFonts.Helvetica);page.drawText(text,{x:40,y:page.getHeight()-70,size:16,font,color:rgb(.2,.15,.4)})}const out=await pdf.save();const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([out],{type:"application/pdf"}));a.download="chanvika-edited.pdf";a.click();setMsg("PDF exported successfully.")}catch(e){setMsg("Could not export this PDF. Try another file.")}}
 return <section className="page editor-page"><div className="section-head"><div><span className="eyebrow">MAIN TOOL</span><h1>PDF Editor</h1><p>Simple controls. Beautiful output. Runs in your browser.</p></div><button className="ghost" onClick={()=>input.current?.click()}>Upload PDF</button><input ref={input} hidden type="file" accept="application/pdf" onChange={e=>load(e.target.files[0])}/></div>
 <div className="editor-shell"><aside><div className="thumb">PDF</div><div className="thumb">PAGE</div></aside><main className="canvas"><div className="paper"><div className="pdf-mark">PDF</div><p>{file?file.name:"Upload a PDF to start editing"}</p></div></main><div className="tools"><h3>Tools</h3>{["Select","Text","Highlight","Draw","Shape","Image","Whiteout","Watermark","Rotate","Delete page"].map((x,i)=><button key={x} onClick={()=>x==="Text"&&setMsg("Text tool selected. Enter text below.")} className={"tool t"+i}>{x}</button>)}<textarea placeholder="Text to add to the first page" value={text} onChange={e=>setText(e.target.value)}/><button className="primary" disabled={!file} onClick={exportPdf}>Save / Export PDF</button></div></div>{msg&&<div className="notice">{msg}</div>}{gate&&<AdGate onContinue={realExport}/>}</section>
}

function Generic({title,desc,color,children}){return <section className={"page feature "+color}><span className="eyebrow">PAPERFLOW TOOL</span><h1>{title}</h1><p>{desc}</p><div className="feature-card">{children||<><div className="drop">Drop files here or choose files</div><button className="primary">Choose Files</button></>}</div></section>}
function App(){const [tab,setTab]=useState("home");useEffect(()=>{if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{})},[]);
return <><header><div className="brand" onClick={()=>setTab("home")}><span>✦</span> Chanvika <b>PDF</b></div><nav><button onClick={()=>setTab("editor")}>PDF Editor</button><button onClick={()=>setTab("converter")}>Converter</button><button onClick={()=>setTab("merge")}>Merge</button><button onClick={()=>setTab("split")}>Split</button></nav><button className="header-btn" onClick={()=>setTab("editor")}>Start Editing →</button></header>
{tab==="home"?<main className="home"><section className="hero"><div className="hero-copy"><span className="eyebrow">ALL-IN-ONE PDF WORKSPACE</span><h1>Make every PDF<br/><em>work your way.</em></h1><p>Edit, merge, split, convert, secure and repair PDFs with a colorful, simple workflow.</p><button className="hero-btn" onClick={()=>setTab("editor")}>Open PDF Editor ✨</button></div><div className="hero-card"><div className="orb"></div><div className="float f1">✎ Edit</div><div className="float f2">⇄ Convert</div><div className="float f3">＋ Merge</div><div className="mini-paper">PDF<br/><small>Beautifully simple</small></div></div></section><section className="tool-grid">{tools.map(([id,t,d,c])=><button className={"tool-card "+c} key={id} onClick={()=>setTab(id)}><span>{t}</span><small>{d}</small><b>→</b></button>)}</section><section className="ad-banner">ADVERTISEMENT · Keep the free tools running</section></main>
:tab==="editor"?<Editor/>:<Generic title={tools.find(x=>x[0]===tab)?.[1]||"PDF Tool"} desc={tools.find(x=>x[0]===tab)?.[2]||"Powerful PDF utility"} color={tools.find(x=>x[0]===tab)?.[3]||"violet"}/>}
<footer><div>© 2026 Chanvika PDF Editor</div><div><button onClick={()=>setTab("about")}>About Us</button><button onClick={()=>setTab("faq")}>FAQ</button><button onClick={()=>setTab("privacy")}>Privacy</button><button onClick={()=>setTab("terms")}>Terms</button><button onClick={()=>setTab("disclaimer")}>Disclaimer</button><button onClick={()=>setTab("contact")}>Contact</button></div></footer></>}

function Legal({title,children}){return <section className="page legal"><span className="eyebrow">INFORMATION</span><h1>{title}</h1><div className="legal-card">{children}</div></section>}
function Root(){const path=location.pathname;return <App/>}
createRoot(document.getElementById("root")).render(<Root/>);