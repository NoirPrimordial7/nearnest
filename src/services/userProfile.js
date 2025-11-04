import { useEffect, useState } from "react";

// Quick in-memory cache so dev is smooth even without Firestore
const cache = new Map();
/*
 Shape we expect:
 { fullName: string, age: number, phone?: string, photoURL?: string }
*/

export function useProfileComplete(uid) {
  const [state, setState] = useState({ loading: true, complete: false });

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!uid) { setState({ loading: false, complete: false }); return; }
      const p = cache.get(uid);
      const complete = !!(p && p.fullName && p.age);
      if (mounted) setState({ loading: false, complete });
    }
    run();
    return () => { mounted = false; };
  }, [uid]);

  return state;
}

export async function getProfile(uid) {
  return cache.get(uid) || null;
}
export async function upsertProfile(uid, data) {
  const current = cache.get(uid) || {};
  cache.set(uid, { ...current, ...data });
}
