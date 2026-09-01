import {getSession} from './session';
import {Plan} from './plans';
export type Entitlement={plan:Plan;status:string;source:string};
export async function getEntitlement():Promise<Entitlement>{
  const s=await getSession(); if(!s?.email)return {plan:'FREE',status:'anonymous',source:'local'};
  const url=process.env.WYDEV_ENTITLEMENT_URL; const secret=process.env.WYDEV_ENTITLEMENT_SECRET;
  if(!url||!secret)return {plan:'FREE',status:'not_configured',source:'wydev-not-configured'};
  try{const r=await fetch(`${url}${url.includes('?')?'&':'?'}email=${encodeURIComponent(s.email)}`,{headers:{Authorization:`Bearer ${secret}`},cache:'no-store'});if(!r.ok)throw new Error();const d=await r.json();const status=String(d.status||'active');const raw=String(d.plan||'FREE').toUpperCase();const active=['active','trialing'].includes(status.toLowerCase());const plan:Plan=raw==='AGENCY'&&active?'AGENCY':raw==='PRO'&&active?'PRO':'FREE';return {plan,status,source:'wydev'}}catch{return {plan:'FREE',status:'unavailable',source:'wydev-error'}}
}
export async function requireFeature(feature:'multipleBlogs'|'bulkSeo'|'fullAudit'|'advancedLinks'|'scheduledAudits'|'scheduledBackups'|'templateHistory'|'advancedHealth'|'searchConsoleAdvanced'){const e=await getEntitlement();const premium=['multipleBlogs','bulkSeo','fullAudit','advancedLinks','scheduledAudits','scheduledBackups','templateHistory','advancedHealth','searchConsoleAdvanced'].includes(feature);if(premium&&e.plan==='FREE'){const err=new Error('PRO_REQUIRED');(err as any).entitlement=e;throw err}return e;}
