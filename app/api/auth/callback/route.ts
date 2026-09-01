import {NextRequest,NextResponse} from 'next/server';
import {oauth} from '@/lib/google';import {setSession,getSession} from '@/lib/session';
export async function GET(req:NextRequest){
 const code=req.nextUrl.searchParams.get('code'),state=req.nextUrl.searchParams.get('state'),expected=req.cookies.get('wyblog_oauth_state')?.value;
 if(!code||!state||!expected||state!==expected)return NextResponse.redirect(new URL('/login?error=oauth',req.url));
 try{
  const c=oauth();const {tokens}=await c.getToken(code);c.setCredentials(tokens);
  const r=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${tokens.access_token}`}});if(!r.ok)throw new Error('USERINFO');const info=await r.json();
  const old=await getSession();await setSession({email:info.email,name:info.name,accessToken:tokens.access_token||old?.accessToken,refreshToken:tokens.refresh_token||old?.refreshToken,blogId:old?.blogId});
  const res=NextResponse.redirect(new URL('/app/blogs',req.url));res.cookies.delete('wyblog_oauth_state');return res;
 }catch{return NextResponse.redirect(new URL('/login?error=oauth',req.url))}
}
