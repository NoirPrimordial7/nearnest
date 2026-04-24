# Nearnest — Firebase Rules Proposal (NEW COLLECTIONS)

_Proposal only. Do NOT edit `firestore.rules` or `storage.rules` based on this doc without a human review pass. This document captures **intent + predicates**, not final rule syntax._

**Scope:** rules for the new mobile collections defined in `FIRESTORE_SCHEMA_CONTRACT.md`. Existing rules for `users`, `roles`, `stores`, `stores/*/documents`, `stores/*/verificationLogs` remain untouched in this proposal (see Phase B of D-009 for eventual rewrite).

**Decision assumptions from `DECISIONS.md`:**
- **D-005:** protected writes happen only in Cloud Functions; client writes to `orders`, `payments`, `deliveries`, `notifications`, prescription state, inventory reservations must be rejected by rules.
- **D-006 + D-014:** Rx items cannot be delivered without an approved **per-store** prescription.
- **D-009:** new rules prefer `request.auth.token.role` (custom claims). `users/{uid}.roles[]` reads remain valid until Phase C.

---

## 1. Common predicates (to add near the top of `match /databases/.../documents`)

```
function signedIn()      { return request.auth != null; }
function uid()           { return request.auth.uid; }
function hasRole(r)      { return signedIn() && request.auth.token.role == r; }
function hasAnyRole(rs)  { return signedIn() && (request.auth.token.role in rs); }
function isSelf(u)       { return signedIn() && uid() == u; }

// Legacy fallback during D-009 Phase A/B
function userDoc(u)      { return get(/databases/$(database)/documents/users/$(u)); }
function legacyRoleHas(u, r) {
  return userDoc(u).data.roles is list && userDoc(u).data.roles.hasAny([r]);
}
function hasRoleOrLegacy(r) {
  return hasRole(r) || (signedIn() && legacyRoleHas(uid(), r));
}

// Store membership — keep existing helpers; add a token-claim-aware shortcut
function isStoreMember(sid) {
  let s = get(/databases/$(database)/documents/stores/$(sid)).data;
  return signedIn() && (
    uid() == s.ownerId ||
    (s.members != null && s.members[uid()] == true) ||
    (s.membersArr is list && s.membersArr.hasAny([uid()]))
  );
}

// Marker for "this write came from a Cloud Function" is not natively available.
// Strategy: reject client writes entirely; Cloud Functions run with admin SDK which bypasses rules.
```

### Rule shape for server-only collections
We rely on the fact that `admin.firestore()` from a Cloud Function bypasses rules. Therefore server-only == "no client path writes". Example skeleton:
```
match /orders/{orderId} {
  allow read: if isOrderReader(orderId);
  allow create, update, delete: if false;  // Cloud Functions only
}
```

---

## 2. `users/{uid}/addresses/{addressId}`

**Intent:** User manages their own addresses; no one else reads or writes them.

```
match /users/{u}/addresses/{addr} {
  allow read, create, update, delete: if isSelf(u);
}
```

**Manual review:** none beyond standard.

---

## 3. `users/{uid}/fcmTokens/{tokenId}`

**Intent:** Self-owned device tokens. Tokens may also be cleaned up server-side when a token moves to another uid.

```
match /users/{u}/fcmTokens/{t} {
  allow read, create, update, delete: if isSelf(u);
}
```

---

## 4. `notifications/{uid}/items/{notificationId}`

**Intent:** Server writes, user reads + marks read.

```
match /notifications/{u}/items/{n} {
  allow read: if isSelf(u);
  allow create, delete: if false;
  // Owner can update ONLY readAt; enforce via affected-keys check:
  allow update: if isSelf(u)
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readAt']);
}
```

**Manual review:** confirm `diff().affectedKeys().hasOnly` is the idiomatic clamp on this codebase.

---

## 5. `stores/{storeId}/inventory/{sku}`

**Intent:** Store staff manage inventory; anyone signed-in can read. `reservedStock`, `searchTokens`, and `popularityScore` are server-only.

```
match /stores/{sid}/inventory/{sku} {
  allow read: if signedIn();

  allow create: if isStoreMember(sid)
    && !('reservedStock' in request.resource.data.keys())   // must start at 0 server-side
    && !('searchTokens' in request.resource.data.keys())
    && !('popularityScore' in request.resource.data.keys());

  allow update: if isStoreMember(sid)
    && request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['name','brand','form','strength','packSize','price','stock',
                  'requiresPrescription','category','tags','imageUrls','isActive','updatedAt']);

  allow delete: if isStoreMember(sid);
}
```

**Manual review:**
- Confirm that trigger-maintained `searchTokens` writes still pass when the Cloud Function rewrites the doc (it bypasses rules — OK).
- Make absolutely sure `stock` drift is reconciled only through `createOrder` / `cancelOrder` / `releaseStaleReservations`. The rule above lets store members change `stock` directly (needed for restock). That's intentional — guard against accidental oversell by convention + `releaseStaleReservations`.

---

## 6. `medicines/{medicineId}`

**Intent:** Curated catalog.

```
match /medicines/{m} {
  allow read: if signedIn();
  allow create, update, delete: if hasAnyRole(['admin']);
}
```

---

## 7. `carts/{uid}`

**Intent:** Ephemeral self-owned cart.

```
match /carts/{u} {
  allow read, create, update, delete: if isSelf(u);
}
```

---

## 8. `prescriptions/{prescriptionId}`

**Intent:** Owner reads own; store members of `storeId` can read + review; state transitions are server-only.

```
match /prescriptions/{p} {
  // Read: owner OR members of storeId OR admin
  allow read: if signedIn() && (
    resource.data.ownerUid == uid() ||
    isStoreMember(resource.data.storeId) ||
    hasAnyRole(['admin'])
  );

  // Create: REJECTED from client — must go through uploadPrescription callable.
  allow create: if false;

  // Update: REJECTED from client — reviewPrescription / onPrescriptionStateChange own state.
  allow update: if false;

  // Delete: admin only (rare; prefer 'expired' state).
  allow delete: if hasAnyRole(['admin']);
}
```

**Manual review (important):**
- Double-check that rejecting client `create` does not break any existing flow the web portal might use (it shouldn't — this is a new collection).
- Confirm Storage rules match (see §13).

---

## 9. `orders/{orderId}` + `orders/{orderId}/events/{eventId}`

**Intent:** Server-only writes; readers are buyer + store members + admin. Events are append-only audit.

```
match /orders/{o} {
  allow read: if signedIn() && (
    resource.data.buyerUid == uid() ||
    isStoreMember(resource.data.storeId) ||
    hasAnyRole(['admin'])
  );
  allow create, update, delete: if false;

  match /events/{e} {
    allow read: if get(/databases/$(database)/documents/orders/$(o))
                  .data.buyerUid == uid()
                || isStoreMember(get(/databases/$(database)/documents/orders/$(o)).data.storeId)
                || hasAnyRole(['admin']);
    allow create, update, delete: if false;
  }
}
```

**Manual review:** the nested `get()` calls in the events reader rule are expensive; consider a helper that computes once. Confirm billing impact on high-traffic order detail screens.

---

## 10. `payments/{paymentId}`

**Intent:** Read by buyer + store members + admin. Server-only writes.

```
match /payments/{p} {
  allow read: if signedIn() && (
    resource.data.orderId != null &&
    (
      get(/databases/$(database)/documents/orders/$(resource.data.orderId)).data.buyerUid == uid()
      || isStoreMember(get(/databases/$(database)/documents/orders/$(resource.data.orderId)).data.storeId)
      || hasAnyRole(['admin'])
    )
  );
  allow create, update, delete: if false;
}
```

**Manual review:** nested read cost like above. Consider mirroring `buyerUid` + `storeId` onto the payment doc to avoid the join — worth 2–3 lines of extra data for read-path simplicity.

---

## 11. `deliveries/{deliveryId}`

**Intent:** Read by buyer + store + assigned driver + admin. Server-only writes (driver location comes via `updateDeliveryLocation`).

```
match /deliveries/{d} {
  allow read: if signedIn() && (
    resource.data.driverUid == uid() ||
    (resource.data.orderId != null &&
      (
        get(/databases/$(database)/documents/orders/$(resource.data.orderId)).data.buyerUid == uid()
        || isStoreMember(get(/databases/$(database)/documents/orders/$(resource.data.orderId)).data.storeId)
      )
    ) ||
    hasAnyRole(['admin'])
  );
  allow create, update, delete: if false;
}
```

**Manual review:** same mirror-data recommendation.

---

## 12. `supportTickets/{ticketId}` + `/messages/{messageId}`

**Intent:** Owner + support/admin read/write. Messages created by either side; `authorRole` set server-side.

```
match /supportTickets/{t} {
  allow read: if signedIn() && (
    resource.data.ownerUid == uid() || hasAnyRole(['support','admin'])
  );
  allow create: if signedIn()
    && request.resource.data.ownerUid == uid()
    && request.resource.data.status == 'open';
  allow update, delete: if hasAnyRole(['support','admin']);

  match /messages/{m} {
    allow read: if get(/databases/$(database)/documents/supportTickets/$(t)).data.ownerUid == uid()
                 || hasAnyRole(['support','admin']);
    // Creates go through postSupportMessage so authorRole can't be spoofed; reject direct client create.
    allow create, update, delete: if false;
  }
}
```

---

## 13. Storage rules additions

Existing `avatars/` and `storeDocs/` rules remain. Add:

```
// Prescription pages — strictly owner + reviewing store members; no public read.
match /prescriptions/{uid}/{prescriptionId}/pages/{file=**} {
  function presc() {
    return firestore.get(/databases/(default)/documents/prescriptions/$(prescriptionId)).data;
  }
  function isOwner()        { return request.auth != null && request.auth.uid == uid; }
  function isStoreMember_() {
    let s = firestore.get(/databases/(default)/documents/stores/$(presc().storeId)).data;
    return request.auth != null
      && (s.ownerId == request.auth.uid
          || (s.members != null && s.members[request.auth.uid] == true));
  }
  function isAdmin_() { return request.auth != null && request.auth.token.role == 'admin'; }

  allow read: if isOwner() || isStoreMember_() || isAdmin_();

  // Direct client uploads are REJECTED. Only signed URLs issued by uploadPrescription succeed.
  allow write: if false;
}

// POD photos (Phase 2)
match /orders/{orderId}/pod/{file=**} {
  allow read: if request.auth != null;   // tighten in Phase 2 once driver roles exist
  allow write: if false;                 // signed URL only
}

// Default deny stays.
```

**Manual review (critical):**
- Confirm that Storage's `firestore.get()` is allowed in this project (it is on Firebase Storage rules; cost-aware).
- Confirm signed-URL issuance in `uploadPrescription` sets the correct `Content-Type` whitelist (`image/*`, `application/pdf`) and a ≤15-minute `expiresAt`.
- Confirm the regex variant: `match /prescriptions/{uid}/{pid}/pages/{file=**}` captures page numbers correctly.

---

## 14. Custom claims migration assumptions (D-009)

- A `setUserRole` callable writes `admin.auth().setCustomUserClaims(uid, { role: 'user'|'storeAdmin'|'admin'|'verifier'|'support' })`.
- Clients must call `await user.getIdToken(true)` after their role changes. The portal should surface a toast if the caller changed **their own** claims.
- Old rules reading `users/{uid}.roles[]` continue to function. New rules in this proposal prefer `request.auth.token.role`.
- A helper `hasRoleOrLegacy(r)` is available for gradual rewrite; prefer `hasRole(r)` in brand-new rules.

---

## 15. App Check notes

- Enable App Check at project level: **reCAPTCHA v3** (web), **Play Integrity** (Android), **App Attest** (iOS). Register the Expo app's bundle ID + the website's origin.
- Enforce App Check on Firestore, Storage, and Cloud Functions **in "warn-only" for first 2 weeks** to surface integration issues, then flip to **enforce** before public launch.
- Places / Maps proxy functions (D-011) must enforce App Check from day one — they are the most-abused surface.
- Store the server-side Places key in Functions config; rotate if any suspicious traffic pattern appears.

---

## 16. Risky areas that need manual review

1. **`prescriptions` client-create rejection.** Verify that rejecting `create` from clients does not collide with any existing web portal flow. (Web today writes to `stores/*/documents`, not `prescriptions/` — should be fine.)
2. **Order/payment/delivery nested `get()` reads in rules.** Billing and latency concern on popular screens. Recommend denormalizing `buyerUid` + `storeId` onto `payments/` and `deliveries/` to avoid the join.
3. **Inventory `stock` direct writes.** Rules let store members set any `stock` value. Intentional for restock, but we rely on convention + `releaseStaleReservations` for accuracy. A misconfigured admin tool could oversell. Consider a `restockInventory` callable for Phase 2.
4. **Rule evaluation budget.** Firestore counts rule `get()`s as reads (billed). Each order detail open would currently cost several. Mirror strategy + `hasRole()` (claim-based) dramatically cuts this.
5. **Storage `prescriptions/*` signed-URL issuance.** The callable must enforce content-type + size; the rule blocks direct writes unconditionally. Any leak in the callable = bypass.
6. **App Check rollout.** "Warn-only" mode must be short — bad actors will probe. Calendar the flip-to-enforce.
7. **Custom claim propagation lag.** If a user's role is changed but their token isn't refreshed, rules will disagree with the admin UI's expectation. Always force `getIdToken(true)` after self-role changes.
8. **Support `authorRole` spoofing.** Rejecting direct message creates (per proposal §12) closes this, but verify the callable is actually routed through for every client.
9. **Admin actions logging.** None of the new rules write audit entries directly; relying on callables. If a Cloud Function forgets to write an audit row, we lose trail. Add unit tests.
10. **Region pinning.** Keep Firestore writes and Functions in `asia-south1`. Rules don't enforce region; convention does.
