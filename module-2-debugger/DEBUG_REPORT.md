# Module 2 — Debug Detective: Post-Mortem

---

## Bug #1 — POST /api/users crashes on creation

**Symptom observed**
`npm test` reported `fetch failed` (server not running during first attempt). Once the server was up, the test failed with `Status 500: UNIQUE constraint failed: users.email` on the second run, and would have returned `500: NOT NULL constraint failed: users.email` on a fresh DB.

**Tracing the code**
The route handler in `server.ts:41` destructured `name` and `email` from `req.body`, but called `createUser(name, undefined as any)` — hardcoded `undefined` instead of passing the `email` variable. The `createUser` function in `db.ts:49` runs `INSERT INTO users (name, email) VALUES (?, ?)` with `email = undefined`, which SQLite rejects because the column is `NOT NULL`.

**Root cause**
A copy-paste / placeholder error: the `email` argument was replaced with `undefined as any`, bypassing TypeScript's type checker at the call site.

**Fix applied**
```ts
// Before
const user = createUser(name, undefined as any);

// After
const user = createUser(name, email);
```

---

## Bug #2 — GET /api/users/1/stats returns wrong post count

**Symptom observed**
Test expected `postCount: 40` (Alice's share of 200 posts across 5 users) but received `undefined`. Direct curl of the endpoint revealed `{"error":"User not found"}` — a secondary issue caused by SQLite's `AUTOINCREMENT` not resetting after `DELETE`, so user ID 1 no longer existed after a re-seed.

**Tracing the code**
`getUserWithPostCount` in `db.ts:82` ran:
```sql
SELECT COUNT(*) as count FROM posts
```
No `WHERE` clause — this counts every post in the table, not just the target user's. Separately, `seed.ts` only ran `DELETE FROM users` without clearing `sqlite_sequence`, so after a test inserted user 6, re-seeding created users starting at ID 7.

**Root cause**
Two separate issues: (1) missing `WHERE authorId = ?` filter in the COUNT query; (2) SQLite's `AUTOINCREMENT` tracks the highest-ever-used ID in `sqlite_sequence` and never reuses it, so `DELETE` alone doesn't reset the counter.

**Fix applied**
```ts
// Before
.prepare("SELECT COUNT(*) as count FROM posts")
.get() as any;

// After
.prepare("SELECT COUNT(*) as count FROM posts WHERE authorId = ?")
.get(userId) as any;
```
```ts
// seed.ts — added after the DELETE statements
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'posts')");
```

---

## Bug #3 — GET /api/posts/feed uses N+1 queries

**Symptom observed**
Test failed with `No queryCount in response — add query counting to detect N+1 (200 posts likely = 201 queries)`. The feed response had no `meta.queryCount` field.

**Tracing the code**
`getAllPostsWithAuthors` in `db.ts:92-105` first fetched all posts with one `SELECT * FROM posts` query, then inside `.map()` fired a separate `SELECT * FROM users WHERE id = ?` for every post — 200 posts = 201 total queries. The route in `server.ts` never included `queryCount` in the meta object it returned.

**Root cause**
Classic N+1 pattern: a loop issuing one query per record rather than fetching related data in a single JOIN. The missing `queryCount` field meant the test couldn't even detect the problem.

**Fix applied**
```ts
// Before — N+1
const posts = db.prepare("SELECT * FROM posts ORDER BY createdAt DESC").all();
return posts.map((post) => {
  const author = db.prepare("SELECT * FROM users WHERE id = ?").get(post.authorId);
  return { ...post, author: author ? { id: author.id, name: author.name } : null };
});

// After — single LEFT JOIN
const rows = db.prepare(`
  SELECT p.*, u.id as userId, u.name as userName
  FROM posts p
  LEFT JOIN users u ON p.authorId = u.id
  ORDER BY p.createdAt DESC
`).all();
return rows.map(({ userId, userName, ...post }) => ({
  ...post,
  author: userId ? { id: userId, name: userName } : null,
}));
```
```ts
// server.ts — added queryCount to meta
res.json({ posts, meta: { count: posts.length, durationMs: duration, queryCount: 1 } });
```

---

## Self-Check Checklist

| # | Check | Status |
|---|-------|--------|
| 1 | All 3 bugs identified and fixed | ✅ |
| 2 | 4-step method (Reproduce → Isolate → Understand → Fix) documented for each bug | ✅ |
| 3 | All 3 tests pass after fixes | ✅ (confirmed: 3/3 PASS) |
| 4 | N+1 query replaced with a JOIN | ✅ (201 queries → 1 LEFT JOIN) |
