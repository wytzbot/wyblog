import {cookies} from 'next/headers';import crypto from 'crypto';
const COOKIE='wyblog_session';function secret(){const s=process.env.NEXTAUTH_SECRET;if(!s||s.length<32)throw new Error('SESSION_SECRET_NOT_CONFIGURED');return crypto.createHash('sha256').update(s).digest();}
export type Session={email:string;name?:string;accessToken?:string;refreshToken?:string;blogId?:string};
function enc(s:string){const iv=crypto.randomBytes(12);const c=crypto.createCipheriv('aes-256-gcm',secret(),iv);const x=Buffer.concat([c.update(s),c.final()]);return `${iv.toString('base64url')}.${c.getAuthTag().toString('base64url')}.${x.toString('base64url')}`}
function dec(v:string){try{const [iv,tag,data]=v.split('.');if(!iv||!tag||!data)return null;const d=crypto.createDecipheriv('aes-256-gcm',secret(),Buffer.from(iv,'base64url'));d.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([d.update(Buffer.from(data,'base64url')),d.final()]).toString()}catch{return null}}
export async function setSession(s:Session){(await cookies()).set(COOKIE,enc(JSON.stringify(s)),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30})}
export async function getSession():Promise<Session|null>{const v=(await cookies()).get(COOKIE)?.value;if(!v)return null;const d=dec(v);if(!d)return null;try{const s=JSON.parse(d);return s?.email?s:null}catch{return null}}
export async function updateSession(patch:Partial<Session>){const s=await getSession();if(!s)throw new Error('NO_SESSION');await setSession({...s,...patch});}
export async function clearSession(){(await cookies()).delete(COOKIE)}
