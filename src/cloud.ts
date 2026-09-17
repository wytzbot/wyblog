import { getAuth, signInAnonymously, type User } from "firebase/auth";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseApp } from "./firebase";

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
let currentUserPromise: Promise<User> | null = null;

export async function getWyBlogUser(): Promise<User> {
  if (!currentUserPromise) {
    currentUserPromise = (auth.currentUser
      ? Promise.resolve(auth.currentUser)
      : signInAnonymously(auth).then(({ user }) => user)
    ).catch((error: unknown) => {
      currentUserPromise = null;
      throw error;
    });
  }
  return currentUserPromise;
}


export async function loadDraftCloud() {
  const user = await getWyBlogUser();
  const snapshot = await getDoc(doc(db, "users", user.uid, "drafts", "current"));
  return snapshot.exists() ? (snapshot.data() as Partial<{title:string;html:string;seoTitle:string;meta:string;labels:string;featureUrl:string}>) : null;
}

export async function saveDraftCloud(draft: {
  title: string; html: string; seoTitle: string; meta: string; labels: string; featureUrl: string;
}) {
  const user = await getWyBlogUser();
  await setDoc(doc(db, "users", user.uid, "drafts", "current"), { ...draft, updatedAt: serverTimestamp() }, { merge: true });
}

export async function clearDraftCloud() {
  const user = await getWyBlogUser();
  await setDoc(doc(db, "users", user.uid, "drafts", "current"), {
    title: "", html: "", seoTitle: "", meta: "", labels: "", featureUrl: "", clearedAt: serverTimestamp()
  }, { merge: true });
}

export async function saveAppSettings(settings: Record<string, unknown>) {
  const user = await getWyBlogUser();
  await setDoc(doc(db, "users", user.uid, "settings", "app"), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveFcmToken(token: string) {
  if (!token) throw new Error("Missing FCM token");
  const user = await getWyBlogUser();
  await setDoc(doc(db, "users", user.uid, "pushTokens", token), {
    token, platform: "web", updatedAt: serverTimestamp()
  }, { merge: true });
}
