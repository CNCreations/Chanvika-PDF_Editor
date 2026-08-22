import React, { useState } from "react";
import { ArrowLeft, Download, FileText, GitMerge, Scissors, Image as ImageIcon, RotateCw, Trash2, Plus, CheckCircle2 } from "lucide-react";
import Upload from "./components/Upload.jsx";
import AdSlot from "./components/AdSlot.jsx";
import { downloadBytes, safeName } from "./utils.js";
import { mergePdfs, extractPages, rotatePdf, imagesToPdf, metadataFromPdf } from "./engine.js";
import { pdfjsLib } from "./pdf.js";

const cfg = {
  merge:{title:"Merge PDF",desc:"Combine multiple PDF files into one clean document.",color:"green"},
  split:{title:"Split PDF",desc:"Choose pages and export a new PDF.",color:"orange"},
  convert:{title:"PDF Converter",desc:"Convert a PDF to images directly in your browser.",color:"purple"},
  image:{title:"Image to PDF",desc:"Combine JPG or PNG images into a PDF.",color:"pink"},
  compress:{title:"Compress PDF",desc:"A local optimization tool with a quality-first workflow.",color:"teal"},
  sign:{title:"Sign PDF",desc:"Open the editor and add your signature.",color:"indigo"},
  protect:{title:"PDF Security",desc:"Manage metadata and privacy-oriented document options.",color:"red"},
  watermark:{title:"Watermark",desc:"Add a custom watermark to your PDF.",color:"cyan"}
};

export default function ToolSuite({tool,onBack,onEditor}) {
  const c=cfg[tool]||cfg.convert;
  const [files,setFiles]=useState([]);
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState(null);
  const [pages,setPages]=useState("");
  const [meta,setMeta]=useState({title:"",author:"",subject:"",keywords:""});
  const [info,setInfo]=useState(null);

  const run=async()=>{
    if(!files.length)return;
    setBusy(true);setResult(null);
    try{
      if(tool==="merge"){
        const out=await mergePdfs(files);setResult({bytes:out,name:"merged.pdf"});
      } else if(tool==="image"){
        const out=await imagesToPdf(files);setResult({bytes:out,name:"images.pdf"});
      } else if(tool==="split"){
        const max=(await pdfjsLib.getDocument({data:new Uint8Array(await files[0].arrayBuffer())}).promise).numPages;
        const idx=parsePageList(pages,max);
        if(!idx.length) throw new Error("Enter page numbers, e.g. 1-3,5");
        const bytes=new Uint8Array(await files[0].arrayBuffer());
        const out=await extractPages(bytes,idx);setResult({bytes:out,name:`${safeName(files[0].name)}-split.pdf`});
      } else if(tool==="convert"){
        const bytes=new Uint8Array(await files[0].arrayBuffer());
        const pdf=await pdfjsLib.getDocument({data:bytes}).promise;
        const p=await pdf.getPage(1);const vp=p.getViewport({scale:1.5});
        const canvas=document.createElement("canvas");canvas.width=vp.width;canvas.height=vp.height;
        await p.render({canvasContext:canvas.getContext("2d"),viewport:vp}).promise;
        const blob=await new Promise(r=>canvas.toBlob(r,"image/jpeg",.92));
        setResult({blob,name:`${safeName(files[0].name)}-page-1.jpg`,type:"image/jpeg",note:`Rendered page 1 of ${pdf.numPages}. Use the editor for full document editing.`});
      } else if(tool==="compress"){
        // Safe MVP: re-save objects with object streams; does not rasterize or destroy text.
        const bytes=new Uint8Array(await files[0].arrayBuffer());
        const {PDFDocument}=await import("./pdf.js");
        const doc=await PDFDocument.load(bytes);const out=await doc.save({useObjectStreams:true});
        setResult({bytes:out,name:`${safeName(files[0].name)}-optimized.pdf`});
      } else if(tool==="protect"){
        const bytes=new Uint8Array(await files[0].arrayBuffer());
        const {PDFDocument}=await import("./pdf.js");
        const doc=await PDFDocument.load(bytes);
        doc.setTitle(meta.title);doc.setAuthor(meta.author);doc.setSubject(meta.subject);doc.setKeywords(meta.keywords.split(",").map(x=>x.trim()).filter(Boolean));
        const out=await doc.save({useObjectStreams:true});setResult({bytes:out,name:`${safeName(files[0].name)}-updated.pdf`});
      } else if(tool==="sign"||tool==="watermark"){
        onEditor(files[0]);
        return;
      }
    }catch(e){alert(e.message||"This operation could not be completed in the browser.");}
    finally{setBusy(false)}
  };

  const download=()=>{
    if(!result)return;
    if(result.blob){downloadBytes(result.blob,result.name,result.type)}
    else downloadBytes(result.bytes,result.name)
  };

  return <div className={`tool-page theme-${c.color}`}>
    <div className="tool-page-top"><button className="ghost-btn" onClick={onBack}><ArrowLeft size={16}/> Home</button></div>
    <div className="tool-hero"><span className="section-kicker">{c.title}</span><h1>{c.title}</h1><p>{c.desc}</p></div>
    <AdSlot className="tool-ad"/>
    <Upload multiple={tool==="merge"||tool==="image"} accept={tool==="image"?".jpg,.jpeg,.png,image/jpeg,image/png":".pdf,application/pdf"} onFiles={setFiles}/>
    {files.length>0&&<div className="selected-files">{files.map((f,i)=><div className="file-row" key={f.name+i}><FileText size={17}/><span>{f.name}</span><small>{Math.round(f.size/1024)} KB</small></div>)}</div>}
    {(tool==="split"&&files.length>0)&&<label className="field wide-field">Pages to extract<input placeholder="1-3,5,8" value={pages} onChange={e=>setPages(e.target.value)}/></label>}
    {tool==="protect"&&files.length>0&&<div className="meta-panel"><h3>Document metadata</h3>{["title","author","subject","keywords"].map(k=><label className="field" key={k}>{k}<input value={meta[k]} onChange={e=>setMeta(m=>({...m,[k]:e.target.value}))}/></label>)}</div>}
    {files.length>0&&<button className="primary-btn center-btn" disabled={busy} onClick={run}>{busy?"Processing…":tool==="sign"||tool==="watermark"?"Open in Editor":"Run "+c.title} <Download size={17}/></button>}
    {result&&<div className="result-card"><CheckCircle2/><div><h3>Ready</h3><p>{result.note||"Your file has been prepared locally."}</p></div><button className="primary-btn small" onClick={download}><Download size={16}/> Download</button></div>}
    <div className="tool-back"><button className="secondary-btn" onClick={onBack}>Back to tools</button></div>
  </div>
}

function parsePageList(input,max){
  const out=[];
  for(const part of input.split(",").map(s=>s.trim()).filter(Boolean)){
    if(part.includes("-")){
      let [a,b]=part.split("-").map(Number);a=Math.max(1,a);b=Math.min(max,b);
      for(let i=a;i<=b;i++)out.push(i-1);
    }else{const n=Number(part);if(n>=1&&n<=max)out.push(n-1)}
  }
  return [...new Set(out)].sort((a,b)=>a-b);
}
