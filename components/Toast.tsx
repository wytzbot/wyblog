'use client';import {useEffect,useRef} from 'react';
export default function Toast({message,onDone}:{message:string;onDone:()=>void}){
  const onDoneRef=useRef(onDone);
  onDoneRef.current=onDone;
  useEffect(()=>{const t=setTimeout(()=>onDoneRef.current(),2600);return()=>clearTimeout(t)},[message]);
  return <div className="toast">{message}</div>
}
