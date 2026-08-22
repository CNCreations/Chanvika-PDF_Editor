import React, { useRef, useState } from "react";
import {
  ArrowRight, Check, FileText, GitMerge, Scissors, ShieldCheck, Sparkles,
  Upload, WandSparkles, Zap, Menu, X, PenLine, LockKeyhole, Image,
  Minimize2, Layers3, Droplets
} from "lucide-react";
import UploadBox from "./components/Upload.jsx";

const tools = [
  {id:"editor", title:"PDF Editor", desc:"Edit, annotate and sign PDFs with a focused workspace.", icon:FileText, color:"blue"},
  {id:"merge", title:"Merge PDF", desc:"Combine multiple PDF files into one.", icon:GitMerge, color:"green"},
  {id:"split", title:"Split PDF", desc:"Extract pages or split a document into files.", icon:Scissors, color:"orange"},
  {id:"convert", title:"PDF Converter", desc:"PDF to images and supported browser-side formats.", icon:Layers3, color:"purple"},
  {id:"sign", title:"Sign PDF", desc:"Create and place a signature on your document.", icon:PenLine, color:"indigo"},
  {id:"protect", title:"Protect PDF", desc:"Metadata, privacy and document protection tools.", icon:LockKeyhole, color:"red"},
  {id:"image", title:"Image to PDF", desc:"Turn JPG and PNG images into a PDF.", icon:Image, color:"pink"},
  {id:"compress", title:"Compress PDF", desc:"Optimize PDFs with browser-side strategies.", icon:Minimize2, color:"teal"},
  {id:"watermark", title:"Watermark", desc:"Add a subtle custom watermark to pages.", icon:Droplets, color:"cyan"}
];

export default function Home({onOpen}) {
  const [mobile, setMobile] = useState(false);
  const input = useRef(null);

  return <div className="home">
    <header className="site-header">
      <a className="brand" href="#"><span className="brand-mark"><FileText size={19}/></span>Paper<span>Flow</span></a>
      <nav className={mobile?"nav open":"nav"}>
        <a href="#tools" onClick={()=>setMobile(false)}>Tools</a>
        <a href="#features" onClick={()=>setMobile(false)}>Features</a>
        <a href="#how" onClick={()=>setMobile(false)}>How it works</a>
        <button className="nav-cta" onClick={()=>input.current?.click()}>Start editing <ArrowRight size={16}/></button>
      </nav>
      <button className="mobile-menu" onClick={()=>setMobile(v=>!v)}>{mobile?<X/>:<Menu/>}</button>
      <input ref={input} hidden type="file" accept=".pdf,application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)onOpen(f)}}/>
    </header>

    <section className="hero">
      <div className="hero-glow glow-one"/><div className="hero-glow glow-two"/>
      <div className="hero-copy">
        <div className="eyebrow"><Sparkles size={15}/> Modern PDF workspace</div>
        <h1>Your PDFs.<br/><em>Your way.</em></h1>
        <p>Edit, convert, organize, sign and protect documents with a beautiful browser-first workflow.</p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={()=>input.current?.click()}><Upload size={18}/> Upload PDF</button>
          <a className="secondary-btn" href="#tools">Explore tools <ArrowRight size={17}/></a>
        </div>
        <div className="trust-row"><span><Check size={15}/> No account required</span><span><Check size={15}/> No AI API</span><span><Check size={15}/> Privacy-first</span></div>
      </div>
      <div className="hero-visual">
        <div className="float-card card-split"><Scissors/><span>Split</span></div>
        <div className="float-card card-merge"><GitMerge/><span>Merge</span></div>
        <div className="document-stack"><div className="paper paper-back"/><div className="paper paper-mid"/><div className="paper paper-front">
          <div className="paper-top"><span>PDF</span><span>01</span></div><div className="paper-title"/><div className="paper-line wide"/><div className="paper-line"/><div className="paper-line"/><div className="paper-box"/><div className="paper-line"/><div className="paper-line short"/>
        </div></div>
        <div className="float-card card-sign"><PenLine/><span>Sign</span></div>
        <div className="float-card card-compress"><Zap/><span>Compress</span></div>
      </div>
    </section>

    <section id="tools" className="section">
      <div className="section-heading"><div><span className="section-kicker">Popular tools</span><h2>Everything you need for PDFs.</h2></div></div>
      <div className="tool-grid">{tools.map(({id,title,desc,icon:Icon,color})=><article className={`tool-card ${color}`} key={id}>
        <div className="tool-icon"><Icon size={22}/></div><h3>{title}</h3><p>{desc}</p><button onClick={()=>onOpen(null,id)}>Open tool <ArrowRight size={15}/></button>
      </article>)}</div>
    </section>

    <section id="features" className="feature-section">
      <div className="centered"><span className="section-kicker">Why PaperFlow</span><h2>Powerful under the hood.<br/>Simple on the surface.</h2></div>
      <div className="feature-grid">
        {[
          [ShieldCheck,"Private by design","Included editing tools process documents locally in your browser."],
          [WandSparkles,"Smart editing","A focused workspace for text, pages, images, drawings and annotations."],
          [Zap,"Fast workflow","Upload, edit, compare and export without unnecessary screens."]
        ].map(([Icon,t,d])=><article className="feature-card" key={t}><div className="feature-icon"><Icon/></div><h3>{t}</h3><p>{d}</p></article>)}
      </div>
    </section>

    <section id="how" className="workflow">
      <div className="workflow-copy"><span className="section-kicker">Simple workflow</span><h2>From PDF to finished document in minutes.</h2><p>No complicated menus. Pick a tool, make your changes, review the result, and export.</p></div>
      <div className="steps">{[["01","Upload","Drop your PDF into the workspace."],["02","Edit","Make precise changes with contextual tools."],["03","Review","Check the result before export."],["04","Export","Download your finished PDF."]].map(([n,t,d])=><div className="step" key={n}><b>{n}</b><div><h3>{t}</h3><p>{d}</p></div></div>)}</div>
    </section>

    <footer className="footer"><div className="brand"><span className="brand-mark"><FileText size={17}/></span>Paper<span>Flow</span></div><span>Browser-first document tools.</span></footer>
  </div>
}
