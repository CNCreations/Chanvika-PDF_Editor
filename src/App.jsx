import React, { useState } from "react";
import Home from "./Home.jsx";
import Editor from "./components/Editor.jsx";
import ToolSuite from "./ToolSuite.jsx";

export default function App(){
  const [view,setView]=useState("home");
  const [file,setFile]=useState(null);
  const [tool,setTool]=useState(null);

  const open=(f,t="editor")=>{
    if(t==="editor" && f){setFile(f);setView("editor");return}
    if(t){setTool(t);setView("tool");return}
    if(f){setFile(f);setView("editor")}
  };

  if(view==="editor"&&file) return <Editor file={file} onBack={()=>{setFile(null);setView("home")}}/>;
  if(view==="tool") return <ToolSuite tool={tool} onBack={()=>{setTool(null);setView("home")}} onEditor={(f)=>{setFile(f);setView("editor")}}/>;
  return <Home onOpen={open}/>;
}
