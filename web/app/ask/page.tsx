"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import styles from "./ask.module.css";
type Source={title?:string;url?:string};
type Message={role:"user"|"assistant";text:string;sources?:Source[]};
const API_BASE=process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/,"")||"http://localhost:8000";
function parseEvents(raw:string){return raw.split("\n\n").map(block=>{const event=block.match(/^event:\s*(.+)$/m)?.[1]?.trim();const data=block.match(/^data:\s*(.+)$/m)?.[1];if(!event||!data)return null;try{return {event,data:JSON.parse(data) as Record<string,unknown>};}catch{return null;}}).filter((item):item is {event:string;data:Record<string,unknown>}=>item!==null);}
export default function AskPage(){
const [messages,setMessages]=useState<Message[]>([]);const [question,setQuestion]=useState("");const [loading,setLoading]=useState(false);const [error,setError]=useState("");
async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const text=question.trim();if(!text||loading)return;setMessages(current=>[...current,{role:"user",text}]);setQuestion("");setError("");setLoading(true);
try{const response=await fetch(API_BASE+"/ai/guest-answer",{method:"POST",headers:{"Content-Type":"application/json",Accept:"text/event-stream"},body:JSON.stringify({question:text,category:"General",subcategory:"Moving and settling in India"})});
if(!response.ok){const detail=await response.text();throw new Error(response.status===429?"The free guest question limit has been reached. Please try again tomorrow.":detail||"The assistant could not answer right now.");}
if(!response.body)throw new Error("The assistant did not return a response stream.");
const reader=response.body.getReader();const decoder=new TextDecoder();let buffer="";let answer="";let sources:Source[]=[];
while(true){const part=await reader.read();buffer+=decoder.decode(part.value,{stream:!part.done});const blocks=buffer.split("\n\n");buffer=blocks.pop()||"";for(const item of parseEvents(blocks.join("\n\n"))){if(item.event==="complete"){answer=typeof item.data.answer==="string"?item.data.answer:"";sources=Array.isArray(item.data.sources)?item.data.sources as Source[]:[];}if(item.event==="error")throw new Error(typeof item.data.message==="string"?item.data.message:"The assistant could not answer that question.");}if(part.done)break;}
setMessages(current=>[...current,{role:"assistant",text:answer||"I could not generate an answer. Please try again.",sources}]);
}catch(cause){setError(cause instanceof Error?cause.message:"Something went wrong. Please try again.");}finally{setLoading(false);}}
return <main className={styles.page}><header className={styles.header}><Link href="/" className={styles.brand}>Batasari</Link><nav><Link href="/help">FAQ &amp; Help</Link><Link href="/login">Sign in</Link></nav></header>
<section className={styles.panel}><div className={styles.intro}><span>BATASARI AI</span><h1>Ask anything about your move.</h1><p>Get help with moving between Indian cities, household shifting, address updates, documents and settling in. You can start without signing in.</p></div>
<div className={styles.chat} aria-live="polite">{messages.length===0&&<div className={styles.welcome}><strong>How can I help you today?</strong><p>Try: “What documents do I need to change my Aadhaar address?”</p><p>Or: “What should I check before booking packers and movers?”</p></div>}
{messages.map((message,index)=><article className={message.role==="user"?styles.userMessage:styles.assistantMessage} key={index}><span>{message.role==="user"?"You":"Batasari AI"}</span><p>{message.text}</p>{message.sources?.length?<ul>{message.sources.map((source,i)=>source.url?<li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title||source.url}</a></li>:<li key={i}>{source.title}</li>)}</ul>:null}</article>)}
{loading&&<p className={styles.loading} role="status">Batasari is preparing an answer…</p>}{error&&<p className={styles.error} role="alert">{error}</p>}</div>
<form className={styles.form} onSubmit={submit}><label className={styles.srOnly} htmlFor="question">Your question</label><input id="question" value={question} onChange={event=>setQuestion(event.target.value)} placeholder="Type your question…" maxLength={2000} disabled={loading}/><button type="submit" disabled={loading||!question.trim()}>{loading?"Sending…":"Ask"}</button></form>
<p className={styles.note}>Guest access has a daily limit to protect service availability. Do not enter passwords, OTPs, Aadhaar numbers or other sensitive personal information. Verify important information with official sources.</p></section></main>;
}
