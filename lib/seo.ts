export type SeoCheck={id:string;status:'pass'|'warn'|'fail';score:number;severity:'low'|'medium'|'high';message:string;recommendation:string;autoFixAvailable?:boolean};
const strip=(html='')=>html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const words=(s:string)=>strip(s).split(/\s+/).filter(Boolean);
function host(){try{return new URL(process.env.APP_URL||'http://localhost:3000').host}catch{return 'localhost:3000'}}
export function analyzeArticle(a:any,sitePosts:any[]=[]){
 const title=String(a.title||''),body=String(a.content||''),desc=String(a.metaDescription||a.description||''),slug=String(a.slug||title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')),kw=String(a.focusKeyword||'').trim().toLowerCase(),text=strip(body),ws=words(body);
 const h1=(body.match(/<h1\b/gi)||[]).length,h2=(body.match(/<h2\b/gi)||[]).length,h3=(body.match(/<h3\b/gi)||[]).length;
 const imgs=[...(body.matchAll(/<img\b[^>]*>/gi))].map(x=>x[0]);
 const links=[...(body.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi))].map(x=>x[1]);
 const checks:SeoCheck[]=[];
 const add=(id:string,ok:boolean,score:number,msg:string,rec:string,sev:'low'|'medium'|'high'='low',auto=false)=>checks.push({id,status:ok?'pass':sev==='high'?'fail':'warn',score:ok?score:0,severity:sev,message:msg,recommendation:rec,autoFixAvailable:auto});
 add('title',!!title,8,title?'Title exists':'Title is missing','Add a clear descriptive title','high');
 add('title-length',title.length>=30&&title.length<=65,6,`Title length: ${title.length} characters`,'Aim for roughly 30–65 characters','medium');
 add('keyword-title',!kw||title.toLowerCase().includes(kw),5,kw?(title.toLowerCase().includes(kw)?'Focus keyword appears in title':'Focus keyword is missing from title'):'No focus keyword set','Use the keyword naturally when relevant','medium');
 add('meta',!!desc,8,desc?'Meta description exists':'Meta description is missing','Write a useful 120–160 character description','high',true);
 add('meta-length',!desc||(desc.length>=120&&desc.length<=160),4,`Meta description length: ${desc.length}`,'Keep it close to 120–160 characters','low');
 add('keyword-meta',!kw||!desc||desc.toLowerCase().includes(kw),4,kw&&desc&&!desc.toLowerCase().includes(kw)?'Focus keyword is missing from meta description':'Focus keyword is represented in meta description','Include the keyword naturally','low');
 add('slug',/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),6,slug?'URL slug format looks clean':'URL slug is missing or contains unnecessary characters','Use lowercase words separated by hyphens','high');
 add('slug-length',!slug||slug.length<=75,3,`URL slug length: ${slug.length}`,'Keep the URL concise','low');
 add('keyword-slug',!kw||!slug||slug.toLowerCase().includes(kw.replace(/\s+/g,'-')),3,kw&&!slug.toLowerCase().includes(kw.replace(/\s+/g,'-'))?'Keyword is missing from URL':'Keyword is represented in URL','Use a concise keyword-relevant slug','low');
 add('h1',h1===1,6,`H1 headings: ${h1}`,'Use exactly one H1 for the article','high');
 add('heading-hierarchy',h1===1&&(h2===0||h1>=1),3,h2?`Heading structure detected: H1 ${h1}, H2 ${h2}, H3 ${h3}`:'No H2 headings detected','Use H2/H3 sections to organize longer content','low');
 add('content',ws.length>=600,6,`Word count: ${ws.length}`,'Aim for enough depth to satisfy the reader; 600+ is a useful diagnostic threshold','medium');
 const longParas=(body.match(/<p[^>]*>([\s\S]*?)<\/p>/gi)||[]).filter(p=>words(p).length>90).length;
 add('paragraphs',longParas===0,3,longParas?`${longParas} long paragraphs detected`:'Paragraph length looks comfortable','Split very long paragraphs for mobile readability','low');
 const sentences=text.split(/[.!?]+/).filter(Boolean), avgSentence=sentences.length?Math.round(ws.length/sentences.length):0;
 add('readability',avgSentence<=28,3,`Average sentence length: ${avgSentence} words`,'Prefer clear sentences of about 28 words or fewer','low');
 const altMissing=imgs.filter(i=>!(/\balt\s*=\s*["'][^"']*["']/i.test(i))).length;
 add('images-alt',altMissing===0,6,altMissing?`${altMissing} image(s) missing ALT text`:'Images have ALT text','Add meaningful ALT text that describes each image','medium',true);
 const internal=links.filter(x=>x.startsWith('/')||x.includes(host())).length,external=links.filter(x=>/^https?:\/\//i.test(x)&&!x.includes(host())).length;
 add('internal-links',internal>0||ws.length<400,3,`Internal links detected: ${internal}`,'Add useful links to related content','low');
 add('external-links',external>0||ws.length<400,2,`External links detected: ${external}`,'Cite useful external sources where appropriate','low');
 const empty=links.filter(x=>!x.trim()||x==='#').length; add('empty-links',empty===0,2,empty?`${empty} empty link(s) detected`:'No empty links detected','Remove empty or placeholder links','medium');
 const dup=sitePosts.filter(p=>String(p.id)!==String(a.id)&&String(p.title||'').trim().toLowerCase()===title.trim().toLowerCase()).length;
 add('duplicate-title',dup===0,5,dup?`Duplicate title found in ${dup} other post(s)`:'Title is unique in the loaded post set','Make the title specific and distinct','high');
 add('canonical',true,2,'Blogger controls the canonical URL for published posts','Review the canonical URL in your Blogger template or published page','low');
 add('social',!!(a.socialImage||a.featuredImage),2,'Social image availability should be reviewed','Configure an Open Graph/social image in supported Blogger/template settings','low');
 add('schema',true,2,'Schema recommendation available','Use Article/BlogPosting schema when appropriate','low');
 const possible=checks.reduce((n,c)=>n+c.score,0)||1,earned=checks.reduce((n,c)=>n+(c.status==='pass'?c.score:0),0);
 return {score:Math.round(earned/possible*100),checks,stats:{words:ws.length,characters:text.length,readingTime:Math.max(1,Math.ceil(ws.length/220)),h1,h2,h3,images:imgs.length,altMissing,internalLinks:internal,externalLinks:external,emptyLinks:empty,averageSentenceLength:avgSentence}};
}
export function auditPosts(posts:any[]){return posts.map(p=>({post:p,...analyzeArticle(p,posts)}));}
