import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity, AlignCenter, AlignLeft, AlignRight, Bold, Bot, ChevronDown, ChevronRight,
  CircleHelp, Code2, Copy, ExternalLink, Eye, FileText, FolderOpen, Grid2X2,
  Highlighter, ImagePlus, Italic, Link2, Menu, Palette, PanelLeft,
  Redo2, RotateCcw, Save, Search, Settings, Sparkles, Trash2, Type,
  Undo2, Video, X, Zap
} from "lucide-react";
import { demoBlog, demoDiagnosis, plugins } from "./data";
import type { Plugin } from "./types";
import { connectBlogger, getBlogPosts, getConnectionStatus, getBillingStatus, runDiagnosis, saveBackupToDrive, saveBloggerPost, startProCheckout, uploadMediaToDrive, verifyProPayment } from "./api";
import { enableWyBlogNotifications } from "./firebase";
import { clearDraftCloud, loadDraftCloud, saveDraftCloud, saveFcmToken } from "./cloud";

type Tab = "home" | "posts" | "plugins" | "diagnosis";
type EditorMode = "visual" | "html";

const initialHtml = `<h2>Welcome to WyBlog</h2>
<p>Write your article here. The editor supports rich text, HTML mode, images, video, links, SEO details and live preview.</p>
<p>Select only the words you want to change, then use the toolbar.</p>`;

function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [blogConnected, setBlogConnected] = useState(false);
  const [plan, setPlan] = useState<"free"|"pro">("free");
  const [billingEmail, setBillingEmail] = useState(() => localStorage.getItem("wyblog_billing_email") || "");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [diagnosisCount, setDiagnosisCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [diagnosis, setDiagnosis] = useState(demoDiagnosis);
  const [connecting, setConnecting] = useState(false);
  const remaining = Math.max(0, (plan === "pro" ? 10 : 5) - diagnosisCount);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get("blogger") === "connected") {
      window.history.replaceState({}, "", window.location.pathname);
      if (active) showNotice("Blogger connected successfully.");
    }
    const transactionId = params.get("transaction_id");
    if (transactionId) {
      void verifyProPayment(transactionId).then(() => { setPlan("pro"); showNotice("Payment verified. WyBlog Pro is now active."); }).catch((error) => showNotice(error instanceof Error ? error.message : "Payment could not be verified."));
      window.history.replaceState({}, "", window.location.pathname);
    }
    void getConnectionStatus().then((result) => {
      if (active) setBlogConnected(Boolean(result.connected));
    }).catch(() => {
      if (active) setBlogConnected(false);
    });
    void getBillingStatus().then((result) => { if (active) setPlan(result.plan); }).catch(() => { if (active) setPlan("free"); });
    return () => { active = false; };
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };

  const handleConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    try { await connectBlogger(); }
    catch { setConnecting(false); showNotice("Google Blogger connection is not configured yet."); }
  };

  const handleDiagnosis = async () => {
    if (remaining <= 0) { showNotice("Your monthly AI diagnosis limit has been reached."); return; }
    try {
      const result = await runDiagnosis();
      if (result.diagnosis && typeof result.diagnosis === "object") setDiagnosis(result.diagnosis as typeof demoDiagnosis);
      setDiagnosisCount((v: number) => v + 1);
      showNotice("Site-wide diagnosis completed.");
    }
    catch { showNotice("Connect Blogger and configure the server diagnosis endpoint first."); }
  };

  const openBlog = () => showNotice("Connect a Blogger account first to open your real blog.");
  const openBlogger = () => window.open("https://www.blogger.com/", "_blank", "noopener,noreferrer");

  if (editorOpen) {
    return <EditorPage onClose={() => setEditorOpen(false)} onNotice={showNotice} blogConnected={blogConnected} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">W</div>
          <div><strong>WyBlog</strong><span>Blogger, simplified.</span></div>
        </div>
        <div className="top-actions">
          <button className="icon-btn" aria-label="Search" onClick={() => showNotice("Search will use Blogger's post search endpoint.")}><Search size={19}/></button>
          <button className="icon-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={20}/></button>
        </div>
      </header>

      <main className="content">
        {!blogConnected && (
          <section className="welcome-card">
            <div className="spark"><Sparkles size={24}/></div>
            <div className="welcome-copy">
              <p className="eyebrow">WELCOME TO WYBLOG</p>
              <h1>Make Blogger feel modern.</h1>
              <p>Manage content, improve SEO, monitor site health and use a cleaner writing experience without replacing Blogger as your publishing backend.</p>
              <button className="primary" onClick={handleConnect} disabled={connecting}>{connecting ? "Connecting…" : "Connect Blogger"} <ChevronRight size={17}/></button>
            </div>
          </section>
        )}

        <section className="blog-row">
          <div>
            <span className="muted">CURRENT BLOG · DEMO PREVIEW</span>
            <h2>{demoBlog.name}</h2>
            <span className="demo-url">{demoBlog.url.replace("https://","")} <span className="demo-label">preview</span></span>
          </div>
          <button className="secondary" onClick={handleConnect} disabled={connecting}><Zap size={16}/> {connecting ? "Connecting…" : "Connect"}</button>
        </section>

        {tab === "home" && <Home onEdit={() => setEditorOpen(true)} diagnosis={diagnosis} onDiagnosis={() => setTab("diagnosis")} plugins={plugins} onNotice={showNotice}/>}
        {tab === "posts" && <PostsView onEdit={() => setEditorOpen(true)} onNotice={showNotice} onLoadPosts={getBlogPosts}/>}
        {tab === "plugins" && <PluginsView plan={plan} onNotice={showNotice} onUpgrade={()=>setCheckoutOpen(true)}/>}
        {tab === "diagnosis" && <DiagnosisView diagnosis={diagnosis} remaining={remaining} onRun={handleDiagnosis} onUpgrade={()=>setCheckoutOpen(true)} onNotice={showNotice}/>}
      </main>

      <nav className="bottom-nav">
        <NavButton active={tab==="home"} icon={<Grid2X2/>} label="Home" onClick={()=>setTab("home")}/>
        <NavButton active={tab==="posts"} icon={<FileText/>} label="Posts" onClick={()=>setTab("posts")}/>
        <NavButton active={tab==="plugins"} icon={<Zap/>} label="Plugins" onClick={()=>setTab("plugins")}/>
        <NavButton active={tab==="diagnosis"} icon={<Bot/>} label="Diagnosis" onClick={()=>setTab("diagnosis")}/>
      </nav>

      {menuOpen && <MenuDrawer close={()=>setMenuOpen(false)} openBlog={openBlog} openBlogger={openBlogger} setTab={setTab} onEdit={()=>setEditorOpen(true)} onNotice={showNotice} onEnableNotifications={async()=>{try{const result=await enableWyBlogNotifications(); if(result.token){await saveFcmToken(result.token); showNotice("Notifications enabled and registered with WyBlog.");} else showNotice(`Notifications not enabled: ${result.reason||"unknown reason"}.`);}catch{showNotice("Could not enable notifications on this device. Check Firebase Authentication/FCM setup.")}}} onUpgrade={()=>setCheckoutOpen(true)}/>}
      {checkoutOpen && <ProCheckout email={billingEmail} setEmail={setBillingEmail} close={()=>setCheckoutOpen(false)} onSubmit={async(currency)=>{if(!billingEmail.trim()){showNotice("Enter your billing email first.");return;} localStorage.setItem("wyblog_billing_email", billingEmail.trim()); try{await startProCheckout(currency,billingEmail.trim());}catch(error){showNotice(error instanceof Error?error.message:"Checkout could not start.");}}}/>}
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

function Home({onEdit,diagnosis,onDiagnosis,plugins,onNotice}:{onEdit:()=>void;diagnosis:typeof demoDiagnosis;onDiagnosis:()=>void;plugins:Plugin[];onNotice:(s:string)=>void}) {
  return <>
    <section className="quick-actions">
      <button className="quick-main" onClick={onEdit}><PenIcon/><span><b>Write article</b><small>Unlimited article body</small></span><ChevronRight/></button>
      <button onClick={()=>onNotice("Blogger post search will use the official API.")}><Search/><span>Search posts</span></button>
      <button onClick={()=>onNotice("Preview is available inside the editor.")}><Eye/><span>Preview</span></button>
    </section>
    <section className="stats-grid">
      <Stat label="Posts" value={"—"}/><Stat label="Pages" value={"—"}/>
      <Stat label="SEO score" value={`${diagnosis.seoScore}/100`}/><Stat label="Broken links" value={diagnosis.brokenLinks}/>
    </section>
    <section className="section-heading"><div><p className="eyebrow">SITE HEALTH</p><h2>Everything at a glance</h2></div><button className="text-btn" onClick={onDiagnosis}>View diagnosis <ChevronRight size={16}/></button></section>
    <div className="health-card"><div className="score-ring"><strong>{diagnosis.seoScore}</strong><span>SEO</span></div><div className="health-copy"><span className="status-pill">Demo preview · connect Blogger for live data</span><h3>{diagnosis.seoIssues} SEO findings · {diagnosis.brokenLinks} broken links</h3><p>Deterministic checks calculate the metrics; AI explains what to fix.</p></div><button className="primary small" onClick={onDiagnosis}>Open report</button></div>
    <section className="section-heading"><div><p className="eyebrow">SEO PLUGINS</p><h2>More ways to optimize</h2></div><button className="text-btn" onClick={()=>onNotice("Open Plugins to browse the full catalog.")}>Browse <ChevronRight size={16}/></button></section>
    <div className="plugin-preview">{plugins.filter(p=>["SEO","Growth","AI"].includes(p.category)).slice(0,6).map(p=><PluginCard key={p.id} plugin={p} onAction={()=>onNotice(`${p.name}: setup is available through the plugin API boundary.`)}/>)}</div>
  </>;
}
function PenIcon(){return <Type/>}
function Stat({label,value}:{label:string;value:string|number}){return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>}
function NavButton({active,icon,label,onClick}:{active:boolean;icon:ReactNode;label:string;onClick:()=>void}){return <button className={`nav-item ${active?"active":""}`} onClick={onClick}>{icon}<span>{label}</span></button>}

function PostsView({onEdit,onNotice,onLoadPosts}:{onEdit:()=>void;onNotice:(s:string)=>void;onLoadPosts:()=>Promise<{posts:unknown[]}>}) {
 const [posts,setPosts]=useState<unknown[]>([]);
 const [loading,setLoading]=useState(false);
 const load=async()=>{setLoading(true);try{const result=await onLoadPosts();setPosts(result.posts||[]);if(!result.posts?.length)onNotice("No Blogger posts were returned.");}catch(error){onNotice(error instanceof Error?error.message:"Could not load Blogger posts.");}finally{setLoading(false);}};
 return <div><section className="section-heading"><div><p className="eyebrow">CONTENT</p><h1>Your posts</h1></div><div className="editor-head-actions"><button className="secondary small" onClick={()=>void load()} disabled={loading}>{loading?"Loading…":"Refresh"}</button><button className="primary small" onClick={onEdit}>New article</button></div></section>{posts.length===0?<div className="empty-state"><strong>Connect Blogger to load your real posts.</strong><p>This screen never labels demo content as published Blogger content.</p></div>:<div className="post-list">{posts.map((post,index)=>{const item=post as {id?:string;title?:string;published?:string;url?:string};return <button className="post-row" key={item.id||index} onClick={()=>item.url?window.open(item.url,"_blank","noopener,noreferrer"):onNotice("This Blogger post has no public URL.")}><div className="post-number">{index+1}</div><div><strong>{item.title||"Untitled post"}</strong><span>{item.published?new Date(item.published).toLocaleDateString():"Blogger post"}</span></div><ChevronRight/></button>})}</div>}</div>;
}

function PluginsView({plan,onNotice,onUpgrade}:{plan:"free"|"pro";onNotice:(s:string)=>void;onUpgrade:()=>void}) {
 const extras: Plugin[] = [
  {id:"schema",name:"Schema & Structured Data",description:"Validate article structure and generate supported schema recommendations.",category:"SEO",snippet:"<!-- WyBlog Schema helper runs from the WyBlog diagnosis panel. -->",instructions:["Open WyBlog → Plugins → Schema & Structured Data.","Run a diagnosis and review the schema recommendations.","Apply approved JSON-LD changes in Blogger Theme → Edit HTML."]},
  {id:"meta",name:"Meta Title & Description",description:"SEO title/description length and quality checks.",category:"SEO",snippet:"<!-- Use Blogger post title/description fields; no secret code is required. -->",instructions:["Open a post in WyBlog.","Set the SEO title and meta description in the editor.","Publish and verify the page source."]},
  {id:"canonical",name:"Canonical URL",description:"Check canonical consistency and duplicate URL signals.",category:"SEO",snippet:"<!-- Canonical auditing is performed by WyBlog's server-side scan. -->",instructions:["Connect Blogger.","Run the URL/SEO audit.","Fix canonical issues in Blogger's theme or post settings."]},
  {id:"og",name:"Open Graph & Social Cards",description:"Check share titles, descriptions and image metadata.",category:"SEO",snippet:"<!-- Open Graph validation is performed by the WyBlog audit. -->",instructions:["Run a connected-site diagnosis.","Review missing Open Graph fields.","Add the recommended tags in Blogger Theme → Edit HTML."]},
  {id:"sitemap",name:"XML Sitemap Monitor",description:"Monitor sitemap availability and discoverability.",category:"SEO",snippet:"<!-- WyBlog checks the public sitemap URL; no theme snippet is required. -->",instructions:["Connect Blogger.","Open the sitemap monitor.","Confirm the public sitemap returns successfully."]},
  {id:"robots",name:"Robots.txt Checker",description:"Inspect robots directives and identify accidental blocking.",category:"SEO",snippet:"<!-- WyBlog checks your public robots.txt file. -->",instructions:["Connect Blogger.","Run the robots check.","Remove accidental Disallow rules in Blogger settings if found."]},
  {id:"alt",name:"Image Alt Text",description:"Find missing or weak image alternative text.",category:"SEO",snippet:"<!-- Alt-text auditing is performed from Blogger post HTML. -->",instructions:["Run a diagnosis.","Open the affected post.","Add descriptive alt text to each meaningful image."]},
  {id:"links",name:"Internal Link Assistant",description:"Find orphaned content and useful internal-link opportunities.",category:"SEO",snippet:"<!-- Internal-link opportunities are calculated from connected Blogger content. -->",instructions:["Connect Blogger and scan posts.","Review suggested internal links.","Add relevant links in the WyBlog editor and republish."]},
  {id:"speed",name:"Core Web Vitals Monitor",description:"Monitor real-world performance signals when a supported analytics source is connected.",category:"Performance",pro:true,snippet:"<!-- Server-side PageSpeed/field data integration; no secret keys here. -->",instructions:["Activate Pro.","Configure the supported performance source on the server.","Run a measurement for your public blog URL."]},
  {id:"searchconsole",name:"Google Search Console",description:"Connect Search Console data for indexing and search performance insights.",category:"Integration",pro:true,snippet:"<!-- Search Console uses OAuth; never paste private credentials into Blogger. -->",instructions:["Activate Pro.","Connect the Google account with property access.","Select the Blogger property and sync its data."]},
  {id:"analytics-google",name:"Google Analytics",description:"Connect analytics signals to the WyBlog dashboard.",category:"Integration",snippet:"<!-- Use only a public measurement ID from your analytics provider. -->",instructions:["Choose your analytics property.","Add its public measurement ID through the supported integration.","Verify incoming events in the analytics dashboard."]},
  {id:"pagespeed",name:"PageSpeed Insights",description:"Run performance checks on public pages through a server-side integration.",category:"Performance",snippet:"<!-- PageSpeed checks run server-side from WyBlog. -->",instructions:["Connect your Blogger site.","Enter/select a public page URL.","Run the check and apply the reported optimizations."]},
  {id:"redirects",name:"Redirect & URL Audit",description:"Find changed URLs and broken destinations.",category:"SEO",pro:true,snippet:"<!-- URL auditing runs server-side; no Blogger theme snippet is required. -->",instructions:["Activate Pro.","Connect Blogger and run the audit.","Fix broken destinations or redirects, then rerun the audit."]}
 ];
 const catalog = [...plugins, ...extras];
 const [filter,setFilter]=useState("All"); const [selected,setSelected]=useState<Plugin|null>(null);
 const categories=useMemo(()=>["All",...Array.from(new Set(catalog.map(p=>p.category)))],[catalog]);
 const visible=filter==="All"?catalog:catalog.filter(p=>p.category===filter);
 return <div><section className="section-heading"><div><p className="eyebrow">PLUGIN MARKET</p><h1>SEO, growth & integrations.</h1><p className="section-sub">Every plugin includes an integration guide. Pro plugins unlock together after verified Pro payment.</p></div></section><div className="chips">{categories.map(c=><button key={c} className={filter===c?"chip active":"chip"} onClick={()=>setFilter(c)}>{c}</button>)}</div><div className="plugin-list">{visible.map(p=><PluginCard key={p.id} plugin={p} onAction={()=>setSelected(p)}/>)}</div>{selected&&<PluginDetails plugin={selected} plan={plan} close={()=>setSelected(null)} onNotice={onNotice} onUpgrade={onUpgrade}/>}</div>;
}

function PluginCard({plugin,onAction}:{plugin:Plugin;onAction:()=>void}){return <article className="plugin-card"><div className="plugin-icon"><Zap size={18}/></div><div><div className="plugin-title">{plugin.name}{plugin.pro&&<span className="pro-tag">PRO</span>}</div><p>{plugin.description}</p></div><button onClick={onAction}>{plugin.installed?"Installed":"Instructions"}</button></article>}

function PluginDetails({plugin,plan,close,onNotice,onUpgrade}:{plugin:Plugin;plan:"free"|"pro";close:()=>void;onNotice:(s:string)=>void;onUpgrade:()=>void}){const locked=Boolean(plugin.pro&&plan!=="pro");const copy=()=>{if(locked){onUpgrade();return;}void navigator.clipboard?.writeText(plugin.snippet).then(()=>onNotice("Plugin code copied."),()=>onNotice("Clipboard access was blocked."))};return <div className="confirm-backdrop"><div className="confirm-card plugin-detail"><div className="plugin-detail-head"><div><h3>{plugin.name}{plugin.pro&&<span className="pro-tag">PRO</span>}</h3><p>{plugin.description}</p></div><button className="icon-btn" onClick={close}><X/></button></div>{plugin.pro&&<div className="plugin-pro-note">{locked?"Pro required · $1/month or ₦1,000/month · all Pro plugins unlock together.":"Pro active · this plugin is unlocked."}</div>}<h4>How to integrate</h4><ol>{plugin.instructions.map((x,i)=><li key={i}>{x}</li>)}</ol><h4>Copyable code / integration note</h4><pre className="plugin-code"><code>{locked?"Upgrade to Pro to reveal the integration code.":plugin.snippet}</code></pre><div className="plugin-detail-actions"><button className="secondary" onClick={close}>Close</button><button className="primary" onClick={copy}>{locked?"Unlock with Pro":<><Copy size={16}/> Copy code</>}</button></div></div></div>}

function DiagnosisView({diagnosis,remaining,onRun,onUpgrade,onNotice}:{diagnosis:typeof demoDiagnosis;remaining:number;onRun:()=>void;onUpgrade:()=>void;onNotice:(s:string)=>void}) {
 return <div><section className="section-heading"><div><p className="eyebrow">AI SITE DIAGNOSIS</p><h1>Find what needs fixing.</h1><p className="section-sub">The scan covers the whole connected Blogger site. AI receives compact findings instead of the entire blog.</p></div></section><div className="diagnosis-top"><div className="big-score"><span>SEO SCORE</span><strong>{diagnosis.seoScore}<small>/100</small></strong></div><Metric label="Broken links" value={diagnosis.brokenLinks}/><Metric label="SEO issues" value={diagnosis.seoIssues}/><Metric label="Pages checked" value={diagnosis.pagesChecked}/><Metric label="Posts checked" value={diagnosis.postsChecked}/></div><div className="diagnosis-actions"><button className="primary" onClick={onRun}>Run new diagnosis</button><span>{remaining} new AI diagnosis{remaining===1?"":"es"} remaining this month</span></div><div className="finding-grid"><Finding title="Critical" icon="!" items={diagnosis.critical}/><Finding title="SEO" icon="S" items={diagnosis.seo}/><Finding title="Good" icon="✓" items={diagnosis.good}/></div><div className="affected"><div><p className="eyebrow">AFFECTED CONTENT</p><h2>Pages and posts</h2></div><div className="affected-row"><span className="affected-type">READY</span><strong>Real affected links appear after the Blogger site scan is connected.</strong></div></div><div className="pro-banner"><div><Sparkles/><div><strong>Need more diagnoses?</strong><span>Pro includes 10 new AI diagnoses each month.</span></div></div><button className="primary small" onClick={onUpgrade}>Get Pro · $1 / ₦1,000</button></div></div>;
}
function Metric({label,value}:{label:string;value:number}){return <div className="metric"><span>{label}</span><strong>{value}</strong></div>}
function Finding({title,icon,items}:{title:string;icon:string;items:string[]}){return <div className="finding"><div className="finding-head"><b>{icon}</b><h3>{title}</h3></div>{items.map(x=><p key={x}>{x}</p>)}</div>}

function MenuDrawer({close,openBlog,openBlogger,setTab,onEdit,onNotice,onEnableNotifications,onUpgrade}:{close:()=>void;openBlog:()=>void;openBlogger:()=>void;setTab:(t:Tab)=>void;onEdit:()=>void;onNotice:(s:string)=>void;onEnableNotifications:()=>void;onUpgrade:()=>void}) {
 const action=(fn:()=>void)=>{close();fn()};
 return <div className="menu-backdrop" onClick={close}><aside className="drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><strong>WyBlog</strong><span>Control panel & Blogger tools</span></div><button className="icon-btn" onClick={close}><X/></button></div>
 <MenuGroup title="CREATE" items={[["New article",<FileText/>,()=>action(onEdit)],["Article drafts",<Save/>,()=>action(()=>onNotice("Drafts will sync through the Blogger posts API."))]]}/>
 <MenuGroup title="MY BLOG" items={[["Open blog",<ExternalLink/>,()=>action(openBlog)],["Blogger editor",<ExternalLink/>,()=>action(openBlogger)],["Switch blog",<Grid2X2/>,()=>action(()=>onNotice("Blog switching will use Blogger's user blog list."))]]}/>
 <MenuGroup title="BLOGGER ACCESSIBLE" items={[["Posts & pages",<FileText/>,()=>action(()=>setTab("posts"))],["Comments",<CircleHelp/>,()=>action(()=>onNotice("Comments are available after the Blogger API comments endpoint is connected."))],["Page views",<Activity/>,()=>action(()=>onNotice("Pageview data is available through Blogger's PageViews resource."))],["Blog profile & locale",<Settings/>,()=>action(()=>onNotice("Blog metadata and locale are available through Blogger's Blogs resource."))]]}/>
 <MenuGroup title="THEME & LAYOUT" items={[["Theme",<Palette/>,()=>action(()=>onNotice("Blogger API v3 does not expose theme/template editing or layout layers. Use Blogger's theme editor."))],["Layout / layers",<PanelLeft/>,()=>action(()=>onNotice("Layout/layer editing is not exposed by the Blogger API v3."))],["Open Blogger theme editor",<ExternalLink/>,()=>action(openBlogger)]]}/>
 <MenuGroup title="TOOLS" items={[
 ["Enable notifications",<Activity/>,()=>action(onEnableNotifications)],["SEO & plugins",<Zap/>,()=>action(()=>setTab("plugins"))],["AI diagnosis",<Bot/>,()=>action(()=>setTab("diagnosis"))],["Settings",<Settings/>,()=>action(()=>onNotice("Settings are grouped here to avoid clutter."))]]}/>
 <MenuGroup title="ACCOUNT" items={[["Upgrade to Pro",<Sparkles/>,()=>action(onUpgrade)],["Backup & export",<FolderOpen/>,()=>action(()=>onNotice("Backup download will export local drafts and server metadata without duplicating the whole Blogger site."))]]}/>
 <div className="drawer-footer">WyBlog · Blogger remains your publishing backend</div></aside></div>
}
function MenuGroup({title,items}:{title:string;items:Array<[string,ReactNode,()=>void]>}){return <div className="menu-group"><p>{title}</p>{items.map(([label,icon,fn])=><button key={label} onClick={fn}>{icon}<span>{label}</span><ChevronRight/></button>)}</div>}

function EditorPage({onClose,onNotice,blogConnected}:{onClose:()=>void;onNotice:(s:string)=>void;blogConnected:boolean}) {
 const editorRef=useRef<HTMLDivElement>(null);
 const fileRef=useRef<HTMLInputElement>(null);
 const imageRef=useRef<HTMLInputElement>(null);
 const videoRef=useRef<HTMLInputElement>(null);
 const savedSelection=useRef<Range|null>(null);
 const [mode,setMode]=useState<EditorMode>("visual");
 const [html,setHtml]=useState(()=>localStorage.getItem("wyblog:draft:html")||initialHtml);
 const [title,setTitle]=useState(()=>localStorage.getItem("wyblog:draft:title")||"My New Blogger Article");
 const [meta,setMeta]=useState(()=>localStorage.getItem("wyblog:draft:meta")||"");
 const [seoTitle,setSeoTitle]=useState(()=>localStorage.getItem("wyblog:draft:seoTitle")||"");
 const [labels,setLabels]=useState(()=>localStorage.getItem("wyblog:draft:labels")||"");
 const [featureUrl,setFeatureUrl]=useState(()=>localStorage.getItem("wyblog:draft:feature")||"");
 const [savedAt,setSavedAt]=useState<string>("Saved locally");
 const [cloudSaving,setCloudSaving]=useState(false);
 const [publishing,setPublishing]=useState(false);
 const [savingBlogger,setSavingBlogger]=useState(false);
 const [seoOpen,setSeoOpen]=useState(true);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [bloggerOpen,setBloggerOpen]=useState(false);
 const [backupOpen,setBackupOpen]=useState(false);
 const [dangerOpen,setDangerOpen]=useState(false);
 const [preview,setPreview]=useState(false);
 const [toolbarHidden,setToolbarHidden]=useState(false);
 const [showDelete,setShowDelete]=useState(false);
 const [linkDialog,setLinkDialog]=useState(false);
 const [linkUrl,setLinkUrl]=useState("");
 const [linkTitle,setLinkTitle]=useState("");
 const lastScroll=useRef(0);

 useEffect(()=>{ if(editorRef.current && mode==="visual" && editorRef.current.innerHTML!==html) editorRef.current.innerHTML=html; },[mode]);
 useEffect(()=>{
   const onScroll=()=>{const y=window.scrollY; if(y>lastScroll.current+3) setToolbarHidden(false); else if(y<lastScroll.current-3) setToolbarHidden(true); lastScroll.current=y;};
   window.addEventListener("scroll",onScroll,{passive:true}); return ()=>window.removeEventListener("scroll",onScroll);
 },[]);
 useEffect(()=>{localStorage.setItem("wyblog:draft:title",title);localStorage.setItem("wyblog:draft:seoTitle",seoTitle);localStorage.setItem("wyblog:draft:meta",meta);localStorage.setItem("wyblog:draft:labels",labels);localStorage.setItem("wyblog:draft:feature",featureUrl);},[title,seoTitle,meta,labels,featureUrl]);
 useEffect(()=>{const t=window.setTimeout(()=>{localStorage.setItem("wyblog:draft:html",html);setSavedAt("Saved locally · "+new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}));},150);return()=>window.clearTimeout(t)},[html]);
 const cloudRevision=useRef(0);
 useEffect(()=>{
   let active=true;
   void loadDraftCloud().then((draft)=>{
     if(!active||!draft) return;
     if(!localStorage.getItem("wyblog:draft:html") && draft.html!==undefined) setHtml(draft.html||"");
     if(!localStorage.getItem("wyblog:draft:title") && draft.title!==undefined) setTitle(draft.title||"");
     if(!localStorage.getItem("wyblog:draft:seoTitle") && draft.seoTitle!==undefined) setSeoTitle(draft.seoTitle||"");
     if(!localStorage.getItem("wyblog:draft:meta") && draft.meta!==undefined) setMeta(draft.meta||"");
     if(!localStorage.getItem("wyblog:draft:labels") && draft.labels!==undefined) setLabels(draft.labels||"");
     if(!localStorage.getItem("wyblog:draft:feature") && draft.featureUrl!==undefined) setFeatureUrl(draft.featureUrl||"");
   }).catch(()=>{});
   return()=>{active=false};
 },[]);
 useEffect(()=>{const revision=++cloudRevision.current;const t=window.setTimeout(()=>{setCloudSaving(true);void saveDraftCloud({title,html,seoTitle,meta,labels,featureUrl}).then(()=>{if(revision===cloudRevision.current)setSavedAt("Saved to Firestore · "+new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}));}).catch(()=>{if(revision===cloudRevision.current)setSavedAt("Saved locally · cloud sync unavailable");}).finally(()=>{if(revision===cloudRevision.current)setCloudSaving(false)});},700);return()=>window.clearTimeout(t)},[title,html,seoTitle,meta,labels,featureUrl]);

 const syncFromEditor=()=>{if(editorRef.current)setHtml(editorRef.current.innerHTML)};
 const saveSelection=()=>{const sel=window.getSelection();if(sel&&sel.rangeCount)savedSelection.current=sel.getRangeAt(0).cloneRange()};
 const restoreSelection=()=>{const sel=window.getSelection();if(sel&&savedSelection.current){sel.removeAllRanges();sel.addRange(savedSelection.current)}};
 const command=(cmd:string,value?:string)=>{restoreSelection();editorRef.current?.focus();document.execCommand(cmd,false,value);syncFromEditor();saveSelection();};
 const insertHtml=(fragment:string)=>{restoreSelection();editorRef.current?.focus();document.execCommand("insertHTML",false,fragment);syncFromEditor();saveSelection()};
 const insertText=(text:string)=>{restoreSelection();editorRef.current?.focus();document.execCommand("insertText",false,text);syncFromEditor();saveSelection()};
 const openGoogle=()=>{const text=window.getSelection()?.toString().trim();window.open("https://www.google.com/search?q="+encodeURIComponent(text||title),"_blank","noopener,noreferrer")};
 const openLinkDialog=()=>{saveSelection();setLinkUrl("");setLinkTitle("");setLinkDialog(true)};
 const applyLink=()=>{const url=linkUrl.trim();if(!url){onNotice("Enter a link URL.");return}if(!/^https?:\/\//i.test(url)){onNotice("Use a full http:// or https:// URL.");return}restoreSelection();editorRef.current?.focus();document.execCommand("createLink",false,url);const range=savedSelection.current;const root=editorRef.current;if(linkTitle.trim()&&range&&root){let node:Element|null=range.commonAncestorContainer.nodeType===Node.ELEMENT_NODE?range.commonAncestorContainer as Element:range.commonAncestorContainer.parentElement;const anchor=node?.closest("a")||root.querySelector(`a[href="${CSS.escape(url)}"]`);anchor?.setAttribute("title",linkTitle.trim())}syncFromEditor();setLinkDialog(false)};

 const handleArticleFile=async(file:File)=>{
   const ext=file.name.toLowerCase().split(".").pop();
   if(!["txt","md","html","htm"].includes(ext||"")){onNotice("Supported article files: .txt, .md, .html and .htm. Other formats need a document parser on the server.");return}
   const raw=await file.text();
   let clean=raw;
   if(ext==="html"||ext==="htm"){const doc=new DOMParser().parseFromString(raw,"text/html");clean=doc.body?.innerText||"";}
   if(ext==="md"){clean=raw.replace(/^#{1,6}\s*/gm,"").replace(/[*_`~]/g,"").replace(/\[([^\]]+)\]\([^)]+\)/g,"$1");}
   const lines=clean.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   const newTitle=lines.shift()||title;
   setTitle(newTitle);
   setSeoTitle(newTitle);
   const body=lines.map(x=>`<p>${escapeHtml(x)}</p>`).join("");
   setMeta(lines.join(" ").slice(0,160));
   setHtml(body);
   if(mode==="visual"&&editorRef.current)editorRef.current.innerHTML=body;
   onNotice(`Imported ${file.name}. First line became the title and remaining text was placed into the article body.`);
 };

 const addImage=()=>imageRef.current?.click();
 const addVideo=()=>videoRef.current?.click();
 const handleImage=async(file:File)=>{
   try{const result=await uploadMediaToDrive(file);if(!result.url)throw new Error("Drive did not return a media URL");insertHtml(`<img src="${escapeHtml(result.url)}" alt="" style="max-width:100%;height:auto" />`);onNotice("Image uploaded to Google Drive and inserted.");}catch(error){onNotice(error instanceof Error?error.message:"Image upload failed. Nothing was inserted.");}
 };
 const handleVideo=async(file:File)=>{
   try{const result=await uploadMediaToDrive(file);if(!result.url)throw new Error("Drive did not return a media URL");insertHtml(`<video controls style="max-width:100%"><source src="${escapeHtml(result.url)}" type="${escapeHtml(file.type||"video/mp4")}"></video>`);onNotice("Video uploaded to Google Drive and inserted.");}catch(error){onNotice(error instanceof Error?error.message:"Video upload failed. Nothing was inserted.");}
 };
 const deleteAll=()=>{setShowDelete(false);setTitle("");setHtml("");setSeoTitle("");setMeta("");setLabels("");setFeatureUrl("");Object.keys(localStorage).filter(k=>k.startsWith("wyblog:draft:")).forEach(k=>localStorage.removeItem(k));if(editorRef.current)editorRef.current.innerHTML="";void clearDraftCloud().catch(()=>{});onNotice("Draft cleared locally and from Firestore when cloud access is available. Nothing was deleted from Blogger.");};
 const publishArticle=async()=>{if(publishing||savingBlogger)return;if(!blogConnected){onNotice("Connect Blogger before publishing.");return}if(!title.trim()||!html.trim()){onNotice("Add an article title and body before publishing.");return}setPublishing(true);try{await saveBloggerPost({title:title.trim(),content:html,labels:labels.split(",").map(x=>x.trim()).filter(Boolean),published:true});onNotice("Published to Blogger successfully.");}catch(error){onNotice(error instanceof Error?error.message:"Blogger publish failed. Nothing was published.");}finally{setPublishing(false);}};
 const saveBloggerDraft=async()=>{if(publishing||savingBlogger)return;if(!blogConnected){onNotice("Connect Blogger before saving to Blogger.");return}setSavingBlogger(true);try{await saveBloggerPost({title:title.trim()||"Untitled",content:html,labels:labels.split(",").map(x=>x.trim()).filter(Boolean),published:false});onNotice("Draft saved to Blogger successfully.");}catch(error){onNotice(error instanceof Error?error.message:"Blogger draft save failed. Nothing was saved remotely.");}finally{setSavingBlogger(false);}};
 const backupToDrive=async()=>{try{const result=await saveBackupToDrive({title,html,seoTitle,meta,labels,featureUrl});onNotice(result.url?"Backup saved to Google Drive.":"Backup saved to Google Drive.");}catch(error){onNotice(error instanceof Error?error.message:"Google Drive backup failed. No remote backup was claimed.");}};

 return <div className="editor-shell">
   <header className="editor-head"><button className="icon-btn" onClick={onClose}><X/></button><div><strong>Article Editor</strong><span>{savedAt}</span></div><div className="editor-head-actions"><button className="secondary small" onClick={()=>setPreview(true)}><Eye/> Preview</button><button className="secondary small" onClick={()=>void saveBloggerDraft()} disabled={cloudSaving||savingBlogger||publishing}><Save/> {savingBlogger?"Saving…":"Save draft"}</button><button className="primary small" onClick={()=>void publishArticle()} disabled={publishing||savingBlogger}><Zap/> {publishing?"Publishing…":"Publish"}</button></div></header>
   <main className="editor-main">
     <input className="title-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Article title" aria-label="Article title"/>
     <div className="editor-grid">
       <section>
         <div className={`floating-toolbar ${toolbarHidden?"toolbar-hidden":""}`} onPointerDown={e=>{if((e.target as HTMLElement).closest("button"))e.preventDefault()}}>
           <ToolbarButton icon={<Undo2/>} label="Undo" onClick={()=>command("undo")}/><ToolbarButton icon={<Redo2/>} label="Redo" onClick={()=>command("redo")}/>
           <ToolbarButton icon={<Bold/>} label="Bold" onClick={()=>command("bold")}/><ToolbarButton icon={<Italic/>} label="Italic" onClick={()=>command("italic")}/>
           <select aria-label="Font" onChange={e=>command("fontName",e.target.value)} defaultValue="Arial"><option value="Arial">Font</option><option value="Georgia">Georgia</option><option value="Verdana">Verdana</option><option value="Times New Roman">Times</option></select>
           <select aria-label="Heading size" onChange={e=>command("formatBlock",e.target.value)} defaultValue="p"><option value="p">Body</option><option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option><option value="h4">H4</option><option value="h5">H5</option><option value="h6">H6</option></select>
           <ToolbarButton icon={<AlignLeft/>} label="Left" onClick={()=>command("justifyLeft")}/><ToolbarButton icon={<AlignCenter/>} label="Center" onClick={()=>command("justifyCenter")}/><ToolbarButton icon={<AlignRight/>} label="Right" onClick={()=>command("justifyRight")}/>
           <label className="color-tool" title="Text color"><Type/><input type="color" defaultValue="#111111" onChange={e=>command("foreColor",e.target.value)}/></label>
           <label className="color-tool" title="Highlight"><Highlighter/><input type="color" defaultValue="#fff2a8" onChange={e=>command("hiliteColor",e.target.value)}/></label>
           <ToolbarButton icon={<Link2/>} label="Link" onClick={openLinkDialog}/>
           <ToolbarButton icon={<Search/>} label="Google search" onClick={openGoogle}/><ToolbarButton icon={<Copy/>} label="Copy" onClick={()=>{const text=window.getSelection()?.toString()||"";if(!text){onNotice("Select text to copy.");return}void navigator.clipboard?.writeText(text).then(()=>onNotice("Selected text copied."),()=>onNotice("Clipboard access was blocked by the browser."))}}/>
           <ToolbarButton icon={<ImagePlus/>} label="Image" onClick={addImage}/><ToolbarButton icon={<Video/>} label="Video" onClick={addVideo}/>
           <ToolbarButton icon={<span className="asterisk">＊</span>} label="Asterisk" onClick={()=>insertText("＊")}/>
           <ToolbarButton icon={<RotateCcw/>} label="Clear formatting" onClick={()=>command("removeFormat")}/>
           <ToolbarButton icon={<Code2/>} label="HTML" onClick={()=>setMode(mode==="visual"?"html":"visual")}/>
         </div>
         {mode==="visual"
           ? <div ref={editorRef} className="rich-editor" contentEditable suppressContentEditableWarning onInput={syncFromEditor} onMouseUp={saveSelection} onKeyUp={saveSelection} onTouchEnd={saveSelection} data-placeholder="Start writing…"/>
           : <textarea className="html-editor" value={html} onChange={e=>setHtml(e.target.value)} spellCheck={false} aria-label="HTML source"/>}
         <div className="editor-foot"><span>Unlimited article body · no character maxlength</span><span>{mode==="html"?"HTML source mode":"Visual mode"}</span></div>
       </section>
       <aside className="editor-side">
         <Collapsible title="SEO details" open={seoOpen} onToggle={()=>setSeoOpen(v=>!v)}><label>SEO title<input value={seoTitle} onChange={e=>setSeoTitle(e.target.value)} placeholder="Search result title"/></label><label>Meta description<textarea value={meta} onChange={e=>setMeta(e.target.value)} placeholder="Write a search-friendly description…"/></label><div className="seo-counter">{meta.length}/160 recommended</div><label>Labels<input value={labels} onChange={e=>setLabels(e.target.value)} placeholder="news, tech, tutorial"/></label><label>Feature image URL<input value={featureUrl} onChange={e=>setFeatureUrl(e.target.value)} placeholder="Recommended 1200 × 675 px"/></label><small>Recommended feature image: <b>1200 × 675 px</b> (16:9). The URL can later be replaced with a Blogger-hosted image.</small></Collapsible>
         <Collapsible title="Theme & layers" open={settingsOpen} onToggle={()=>setSettingsOpen(v=>!v)}><p className="side-note">Blogger API v3 exposes posts, pages, comments, blog metadata and pageviews, but not theme/template or layout-layer editing. WyBlog therefore won't pretend these controls are available.</p><button className="secondary small" onClick={()=>window.open("https://www.blogger.com/","_blank","noopener,noreferrer")}><ExternalLink/> Open Blogger theme editor</button></Collapsible>
         <Collapsible title="Blogger setup" open={bloggerOpen} onToggle={()=>setBloggerOpen(v=>!v)}><div className="setting-list"><button onClick={()=>onNotice("Blogger comments can be accessed through the API.")}>Comments</button><button onClick={()=>onNotice("Blog locale and metadata can be read through the API.")}>Locale & blog profile</button><button onClick={()=>onNotice("Pageview data can be requested through the API.")}>Page views</button><button onClick={()=>onNotice("Post labels are part of Blogger post data.")}>Labels</button></div></Collapsible>
         <Collapsible title="Backup" open={backupOpen} onToggle={()=>setBackupOpen(v=>!v)}><button className="secondary small" onClick={()=>void backupToDrive()}><FolderOpen/> Save backup to Google Drive</button><button className="secondary small" onClick={()=>downloadBackup({title,html,meta,labels,featureUrl})}><FolderOpen/> Download local backup</button><small>Remote backups use the server-side Google Drive integration; local download is an additional device backup.</small></Collapsible>
         <Collapsible title="Danger zone" open={dangerOpen} onToggle={()=>setDangerOpen(v=>!v)}><button className="danger" onClick={()=>setShowDelete(true)}><Trash2/> Delete all article content</button></Collapsible>
       </aside>
     </div>
   </main>
   <input ref={fileRef} hidden type="file" accept=".txt,.md,.html,.htm,text/plain,text/markdown,text/html" onChange={e=>{const f=e.target.files?.[0];if(f)void handleArticleFile(f);e.currentTarget.value=""}}/>
   <input ref={imageRef} hidden type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)handleImage(f);e.currentTarget.value=""}}/>
   <input ref={videoRef} hidden type="file" accept="video/*" onChange={e=>{const f=e.target.files?.[0];if(f)handleVideo(f);e.currentTarget.value=""}}/>
   <div className="editor-upload-row"><button className="secondary small" onClick={()=>fileRef.current?.click()}><UploadIcon/> Upload article as file</button><button className="secondary small" onClick={()=>setMode(mode==="visual"?"html":"visual")}><Code2/> {mode==="visual"?"Switch to HTML":"Switch to visual"}</button></div>
   {preview&&<Preview title={title} html={html} close={()=>setPreview(false)}/>}
   {showDelete&&<Confirm title="Clear this article?" text="This clears the local draft only. It does not delete anything from Blogger." cancel={()=>setShowDelete(false)} confirm={deleteAll}/>}
   {linkDialog&&<LinkDialog url={linkUrl} title={linkTitle} setUrl={setLinkUrl} setTitle={setLinkTitle} cancel={()=>setLinkDialog(false)} apply={applyLink}/>}
 </div>
}

function ProCheckout({email,setEmail,close,onSubmit}:{email:string;setEmail:(v:string)=>void;close:()=>void;onSubmit:(currency:"USD"|"NGN")=>void}){return <div className="confirm-backdrop"><div className="confirm-card"><div className="plugin-detail-head"><div><h3>Unlock WyBlog Pro</h3><p>All Pro plugins unlock together.</p></div><button className="icon-btn" onClick={close}><X/></button></div><label>Billing email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label><div className="pro-price-grid"><button className="secondary" onClick={()=>onSubmit("USD")}>Pay $1/month</button><button className="primary" onClick={()=>onSubmit("NGN")}>Pay ₦1,000/month</button></div><small>Payment is verified server-side before Pro is activated.</small></div></div>}

function ToolbarButton({icon,label,onClick}:{icon:ReactNode;label:string;onClick:()=>void}){return <button className="toolbar-btn" title={label} aria-label={label} onClick={onClick}>{icon}</button>}
function Collapsible({title,open,onToggle,children}:{title:string;open:boolean;onToggle:()=>void;children:ReactNode}){return <div className="side-card"><button className="side-title" onClick={onToggle}><b>{title}</b>{open?<ChevronDown/>:<ChevronRight/>}</button>{open&&<div className="side-body">{children}</div>}</div>}
function Preview({title,html,close}:{title:string;html:string;close:()=>void}){return <div className="preview-backdrop"><div className="preview-panel"><header><strong>Preview</strong><button className="icon-btn" onClick={close}><X/></button></header><article className="preview-article"><h1>{title}</h1><div dangerouslySetInnerHTML={{__html:sanitizeHtml(html)}}/></article></div></div>}
function Confirm({title,text,cancel,confirm}:{title:string;text:string;cancel:()=>void;confirm:()=>void}){return <div className="confirm-backdrop"><div className="confirm-card"><h3>{title}</h3><p>{text}</p><div><button className="secondary" onClick={cancel}>Cancel</button><button className="danger filled" onClick={confirm}>Clear</button></div></div></div>}
function LinkDialog({url,title,setUrl,setTitle,cancel,apply}:{url:string;title:string;setUrl:(v:string)=>void;setTitle:(v:string)=>void;cancel:()=>void;apply:()=>void}){return <div className="confirm-backdrop"><div className="confirm-card link-dialog"><h3>Add link</h3><label>URL<input autoFocus value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com"/></label><label>Link title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Describe this link"/></label><div><button className="secondary" onClick={cancel}>Cancel</button><button className="primary" onClick={apply}>Add link</button></div></div></div>}
function UploadIcon(){return <UploadArticleIcon/>}
function UploadArticleIcon(){return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></svg>}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]!))}
function sanitizeHtml(value:string){
 const doc=new DOMParser().parseFromString(value,"text/html");
 doc.querySelectorAll("script,iframe,object,embed,form,style").forEach((el)=>el.remove());
 doc.querySelectorAll("*").forEach((el)=>{
   [...el.attributes].forEach((attr)=>{
     if(attr.name.toLowerCase().startsWith("on")) el.removeAttribute(attr.name);
     if((attr.name==="href"||attr.name==="src") && /^(javascript:|data:text\/html)/i.test(attr.value.trim())) el.removeAttribute(attr.name);
   });
 });
 return doc.body.innerHTML;
}
function downloadBackup(data:Record<string,string>){const blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="wyblog-article-backup.json";a.click();URL.revokeObjectURL(url)}

export default App;
