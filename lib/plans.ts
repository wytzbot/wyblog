export type Plan='FREE'|'PRO'|'AGENCY';
export const planPrice=(p:Plan)=>p==='PRO'?Number(process.env.PLAN_PRO_NGN||2000):p==='AGENCY'?Number(process.env.PLAN_AGENCY_NGN||5000):0;
export const FEATURES={multipleBlogs:'PRO',bulkSeo:'PRO',fullAudit:'PRO',advancedLinks:'PRO',scheduledAudits:'PRO',scheduledBackups:'PRO',templateHistory:'PRO',advancedHealth:'PRO',searchConsoleAdvanced:'PRO'} as const;
export function hasFeature(plan:Plan,feature:keyof typeof FEATURES){const need=FEATURES[feature];return plan==='AGENCY'||plan===need}
