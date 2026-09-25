// In-memory stand-in for the claude.ai artifact runtime (window.claude).
// Injected with page.addInitScript, so it must be self-contained.
export function installMockClaude(opts) {
  const { seed = {}, canWrite = true, userId = "u_test", receipt = null } = opts || {};
  const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
  const docs = new Map(Object.entries(clone(seed)));
  const listeners = new Set();
  const mock = { docs, saves: [], sampleCalls: [] };
  window.__mock = mock;

  const denied = () => ({ code: "invalid_argument", message: "write not allowed" });
  const notify = () => setTimeout(() => listeners.forEach((l) => l()), 0);
  const merge = (target, src) => {
    for (const [k, v] of Object.entries(src)) {
      const both = v && typeof v === "object" && !Array.isArray(v) && target[k] && typeof target[k] === "object" && !Array.isArray(target[k]);
      if (both) merge(target[k], v);
      else target[k] = clone(v);
    }
  };
  const snap = (path) => {
    const d = docs.get(path);
    return { id: path.split("/").pop(), exists: !!d, data: () => clone(d), metadata: { fromCache: false, hasPendingWrites: false } };
  };
  const listen = (run, next) => {
    const l = () => next(run());
    listeners.add(l);
    setTimeout(l, 0);
    return () => listeners.delete(l);
  };

  function docRef(path) {
    return {
      id: path.split("/").pop(),
      path,
      get: async () => snap(path),
      set: async (data) => { if (!canWrite) throw denied(); docs.set(path, clone(data)); notify(); },
      update: async (data) => {
        if (!canWrite) throw denied();
        if (!docs.has(path)) throw { code: "invalid_argument", message: "no such document" };
        merge(docs.get(path), data); notify();
      },
      delete: async () => { if (!canWrite) throw denied(); docs.delete(path); notify(); },
      onSnapshot: (next) => listen(() => snap(path), next),
      collection: (sub) => collRef(path + "/" + sub),
    };
  }
  function query(path, order) {
    const depth = path.split("/").length + 1;
    const run = () => {
      let list = [...docs.keys()].filter((p) => p.startsWith(path + "/") && p.split("/").length === depth).sort().map(snap);
      if (order) {
        const dir = order.dir === "desc" ? -1 : 1;
        list = list.sort((a, b) => (String(a.data()[order.field]) < String(b.data()[order.field]) ? -dir : dir));
      }
      return { docs: list, size: list.length, empty: !list.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } };
    };
    return {
      where() { return this; },
      limit() { return this; },
      orderBy: (field, dir = "asc") => query(path, { field, dir }),
      get: async () => run(),
      onSnapshot: (next) => listen(run, next),
    };
  }
  function collRef(path) {
    const ref = {
      ...query(path),
      path,
      doc: (id) => docRef(path + "/" + (id || Math.random().toString(36).slice(2, 12))),
      add: async (data) => { const r = ref.doc(); await r.set(data); return r; },
    };
    return ref;
  }

  const db = { doc: docRef, collection: collRef };
  const profile = (id) => ({ id, name: id === userId ? "Test User" : "", avatarUrl: "data:,", color: "#336", email: null, isMe: id === userId, guest: false });
  const user = {
    id: async () => userId,
    me: async () => ({ ...profile(userId), isOwner: true, canEdit: canWrite }),
    can: async () => canWrite,
    isOwner: async () => true,
    canEdit: async () => canWrite,
    profiles: async (ids) => Object.fromEntries([].concat(ids).map((id) => [id, profile(id)])),
  };
  const downloads = { save: async (req) => { mock.saves.push(req); return { status: "saved" }; } };
  const sample = async () => ({ text: "", truncated: false, modelTierApplied: "default" });
  sample.json = async (prompt) => { mock.sampleCalls.push(prompt); return clone(receipt); };
  sample.limits = async () => ({ maxPromptBytes: 65536, images: { maxCount: 5, maxInputBytes: 20e6, mediaTypes: ["image/jpeg", "image/png"] } });

  const namespaces = { db, user, downloads, sample };
  window.claude = { use: async (name) => namespaces[name] || null };
}
