# Graph Report - C:\projects\nearnest\web-portal  (2026-04-24)

## Corpus Check
- 77 files · ~86,143 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 208 nodes · 207 edges · 50 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 14 edges
2. `UserHome()` - 5 edges
3. `AdminLayout()` - 4 edges
4. `Dashboard()` - 4 edges
5. `listStores()` - 4 edges
6. `SupportTickets()` - 4 edges
7. `DocumentVerification()` - 4 edges
8. `docToStore()` - 4 edges
9. `useClickAway()` - 3 edges
10. `setStoreStatus()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `VerificationStatus()` --calls--> `useAuth()`  [INFERRED]
  C:\projects\nearnest\web-portal\src\pages\register-store\VerificationStatus.jsx → C:\projects\nearnest\web-portal\src\pages\Auth\AuthContext.jsx
- `AdminLayout()` --calls--> `useAuth()`  [INFERRED]
  C:\projects\nearnest\web-portal\src\pages\Admin copy\AdminLayout.jsx → C:\projects\nearnest\web-portal\src\pages\Auth\AuthContext.jsx
- `SupportTickets()` --calls--> `useAuth()`  [INFERRED]
  C:\projects\nearnest\web-portal\src\pages\Admin copy\Support\SupportTickets.jsx → C:\projects\nearnest\web-portal\src\pages\Auth\AuthContext.jsx
- `DocumentVerification()` --calls--> `useAuth()`  [INFERRED]
  C:\projects\nearnest\web-portal\src\pages\Admin copy\Verification\DocumentVerification.jsx → C:\projects\nearnest\web-portal\src\pages\Auth\AuthContext.jsx
- `CreateStore()` --calls--> `useAuth()`  [INFERRED]
  C:\projects\nearnest\web-portal\src\pages\register-store\CreateStore.jsx → C:\projects\nearnest\web-portal\src\pages\Auth\AuthContext.jsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (7): RoleRedirect(), useAuth(), CreateStore(), ProtectedRoute(), StoreAdminLayout(), useClickAway(), ProfileSetup()

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (7): RequireProfile(), initials(), prettyAddress(), StoreCard(), useAvatarMenu(), UserHome(), useProfileComplete()

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (3): ReviewSubmit(), UploadDocuments(), hasAllRequired()

### Community 3 - "Community 3"
Cohesion: 0.27
Nodes (7): createStore(), docToStore(), ensureAddressShape(), getStore(), isAdmin(), listenUserStores(), toArrayMaybe()

### Community 4 - "Community 4"
Cohesion: 0.31
Nodes (5): deleteStore(), listStores(), mockDelay(), normalizeStore(), setStoreStatus()

### Community 5 - "Community 5"
Cohesion: 0.31
Nodes (6): Card(), Dashboard(), Icon(), KPICard(), makeMonthBuckets(), RangeTabs()

### Community 6 - "Community 6"
Cohesion: 0.39
Nodes (5): DocumentVerification(), Icon(), Pill(), prettyLabel(), toDate()

### Community 7 - "Community 7"
Cohesion: 0.46
Nodes (6): buildRange(), formatDate(), Icon(), Pagination(), StatusPill(), StoresPage()

### Community 8 - "Community 8"
Cohesion: 0.4
Nodes (3): normalizeTicket(), SupportTickets(), tsToStr()

### Community 9 - "Community 9"
Cohesion: 0.4
Nodes (3): StatusBadge(), statusClass(), VerificationStatus()

### Community 10 - "Community 10"
Cohesion: 0.7
Nodes (3): AdminLayout(), Icon(), useClickAway()

### Community 11 - "Community 11"
Cohesion: 0.6
Nodes (3): Analytics(), downloadCSV(), renderPercentLabel()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (2): buildDayBuckets(), StoreAdminDashboard()

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (2): getNow(), SupportDashboard()

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (2): fetchRoles(), redirectByRole()

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (1): Inventory()

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (2): formatBytes(), StoreAdvertisement()

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (1): MainContent()

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (1): NavBar()

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (1): Sidebar()

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (1): StoreSupportHelp()

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (1): StoreAdminHome()

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (1): StoreSettings()

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 28`** (2 nodes): `App()`, `App.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `NearnestHome.jsx`, `NearNestHome()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `AdminDashboard()`, `AdminDashboard.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `Notifications.jsx`, `Notifications()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `RolePermission.jsx`, `RolePermission()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `Settings.jsx`, `Settings()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `StoreManagement.jsx`, `StoreManagement()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `SignUp.jsx`, `SignUp()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `VerifyEmail.jsx`, `VerifyEmail()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `landing.jsx`, `Landing()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `RegisterStore.jsx`, `RegisterStore()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `StoreForm.jsx`, `StoreForm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `SupportAnalytics.jsx`, `SupportAnalytics()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `SupportHome.jsx`, `SupportHome()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `seedFirestore.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `firebase.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `firebase.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 0` to `Community 1`, `Community 2`, `Community 6`, `Community 8`, `Community 9`, `Community 10`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `UserHome()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `DocumentVerification()` connect `Community 6` to `Community 0`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `useAuth()` (e.g. with `AdminLayout()` and `SupportTickets()`) actually correct?**
  _`useAuth()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `UserHome()` (e.g. with `useAuth()` and `useProfileComplete()`) actually correct?**
  _`UserHome()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._