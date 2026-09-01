import {google} from 'googleapis';
export function oauth(){return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,`${process.env.APP_URL||'http://localhost:3000'}/api/auth/callback`)}
export function authClient(accessToken?:string,refreshToken?:string){const c=oauth();c.setCredentials({access_token:accessToken,refresh_token:refreshToken});return c}
export const BLOGGER_SCOPE='https://www.googleapis.com/auth/blogger';
export const SEARCH_CONSOLE_SCOPE='https://www.googleapis.com/auth/webmasters.readonly';
export const ANALYTICS_SCOPE='https://www.googleapis.com/auth/analytics.readonly';
