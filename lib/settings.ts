import {cookies} from 'next/headers';
const COOKIE='wyblog_settings';
export type WySettings={seoTitlePattern:string;defaultMetaDescription:string;defaultSchema:string;organizationName:string;authorName:string;socialImage:string;facebookAppId:string;twitterSite:string;canonicalMode:string};
const defaults:WySettings={seoTitlePattern:'%title% | %site%',defaultMetaDescription:'',defaultSchema:'Article',organizationName:'',authorName:'',socialImage:'',facebookAppId:'',twitterSite:'',canonicalMode:'blogger'};
export async function getSettings(){const raw=(await cookies()).get(COOKIE)?.value;if(!raw)return defaults;try{return {...defaults,...JSON.parse(Buffer.from(raw,'base64url').toString())}}catch{return defaults}}
export async function saveSettings(patch:Partial<WySettings>){const next={...(await getSettings()),...patch};(await cookies()).set(COOKIE,Buffer.from(JSON.stringify(next)).toString('base64url'),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*365});return next}
