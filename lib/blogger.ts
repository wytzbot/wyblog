import { google } from 'googleapis';
import { authClient } from './google';
import { sanitizeHtml } from './sanitize';

export async function blogger(session:{accessToken?:string;refreshToken?:string}) {
  if (!session.accessToken && !session.refreshToken) throw new Error('NO_GOOGLE_CONNECTION');
  return google.blogger({ version:'v3', auth: authClient(session.accessToken, session.refreshToken) });
}
export async function listBlogs(s:any){ const b=await blogger(s); return (await b.blogs.listByUser({userId:'self'})).data.items||[]; }
export async function getOwnedBlog(s:any, blogId:string){
  if(!blogId) throw new Error('BLOG_REQUIRED');
  const blogs=await listBlogs(s); const blog=blogs.find((x:any)=>String(x.id)===String(blogId));
  if(!blog) throw new Error('BLOG_NOT_OWNED'); return blog;
}
export async function listPosts(s:any,blogId:string,opts:{maxResults?:number;pageToken?:string;fetchBodies?:boolean}={}){
  const b=await blogger(s); await getOwnedBlog(s,blogId);
  return (await b.posts.list({blogId,fetchBodies:opts.fetchBodies!==false,maxResults:Math.min(Math.max(opts.maxResults||20,1),100),pageToken:opts.pageToken})).data;
}
export async function getPost(s:any,blogId:string,postId:string){const b=await blogger(s);await getOwnedBlog(s,blogId);return (await b.posts.get({blogId,postId,view:'ADMIN'})).data;}
export async function savePost(s:any,blogId:string,data:any,postId?:string,publish=false){
  const b=await blogger(s); await getOwnedBlog(s,blogId);
  const requestBody:any={title:String(data.title||''),content:sanitizeHtml(String(data.content||'')),labels:Array.isArray(data.labels)?data.labels:[]};
  if(data.searchDescription!==undefined) requestBody.searchDescription=String(data.searchDescription||'');
  // Blogger has no native "focus keyword" or custom slug field. customMetaData is a
  // free-form JSON string Blogger stores and returns unmodified for exactly this kind
  // of client-owned metadata, so we use it instead of silently dropping these values.
  if(data.focusKeyword!==undefined||data.slug!==undefined) requestBody.customMetaData=JSON.stringify({focusKeyword:String(data.focusKeyword||''),slug:String(data.slug||'')});
  // Blogger API v3: `isDraft` is only a valid parameter for posts.insert. posts.update
  // does not accept it (it is silently ignored), so it must never be relied on to
  // change publish state on an existing post. Passing publish:true here explicitly
  // moves the post live; omitting it leaves the post's current live/draft state
  // untouched, which is what a plain content edit ("Save") should do.
  if(postId) return (await b.posts.update({blogId,postId,...(publish?{publish:true}:{}),requestBody})).data;
  return (await b.posts.insert({blogId,isDraft:!publish,requestBody})).data;
}
export function parseWyMeta(post:any):{focusKeyword:string;slug:string}{
  try{const m=JSON.parse(post?.customMetaData||'{}');return {focusKeyword:String(m.focusKeyword||''),slug:String(m.slug||'')}}catch{return {focusKeyword:'',slug:''}}
}
export async function patchPost(s:any,blogId:string,postId:string,data:any){
  const b=await blogger(s); await getOwnedBlog(s,blogId);
  const requestBody:any={};
  if(data.title!==undefined) requestBody.title=String(data.title);
  if(data.content!==undefined) requestBody.content=sanitizeHtml(String(data.content));
  if(data.labels!==undefined) requestBody.labels=Array.isArray(data.labels)?data.labels:[];
  if(data.searchDescription!==undefined) requestBody.searchDescription=String(data.searchDescription||'');
  return (await b.posts.patch({blogId,postId,requestBody})).data;
}
export async function deletePost(s:any,blogId:string,postId:string){const b=await blogger(s);await getOwnedBlog(s,blogId);await b.posts.delete({blogId,postId});}
export async function listPages(s:any,blogId:string){const b=await blogger(s);await getOwnedBlog(s,blogId);return (await b.pages.list({blogId,maxResults:100,fetchBodies:true,view:'ADMIN'})).data.items||[]}
export async function getPage(s:any,blogId:string,pageId:string){const b=await blogger(s);await getOwnedBlog(s,blogId);return (await b.pages.get({blogId,pageId,view:'ADMIN'})).data}
export async function getPageViews(s:any,blogId:string,range:'7DAYS'|'30DAYS'|'all'='30DAYS'){const b=await blogger(s);await getOwnedBlog(s,blogId);return (await b.pageViews.get({blogId,range})).data}
export function friendlyGoogleError(e:any){
  const code=e?.code||e?.response?.status;
  if(e?.message==='BLOG_NOT_OWNED') return 'That Blogger blog is not connected to this Google account.';
  if(e?.message==='BLOG_REQUIRED') return 'Select a Blogger blog first.';
  if(e?.message==='NO_GOOGLE_CONNECTION') return 'Connect your Google account to use Blogger.';
  if(code===401)return 'Your Google connection has expired. Reconnect Blogger.';
  if(code===403)return 'Blogger permission was denied. Reconnect and allow the requested access.';
  if(code===404)return 'The requested Blogger content could not be found.';
  if(code===409)return 'Blogger rejected this change because the content is out of date. Refresh and try again.';
  if(code===429)return 'Blogger is temporarily rate-limiting requests. Please wait and try again.';
  return 'Blogger could not complete the request.';
}
