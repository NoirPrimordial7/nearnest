# Graph Report - C:\projects\nearnest\web-portal  (2026-04-28)

## Corpus Check
- 135 files · ~202,124 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 501 nodes · 639 edges · 82 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 14 edges
2. `upsertUserProfileFromAuthUser()` - 11 edges
3. `getAuthErrorMessage()` - 10 edges
4. `normalizeStore()` - 9 edges
5. `normalize_record()` - 9 edges
6. `getPostAuthRouteForUser()` - 8 edges
7. `useFontScale()` - 7 edges
8. `getInventoryGroupsForStore()` - 7 edges
9. `searchMedicinesApi()` - 6 edges
10. `getMedicineDetailApi()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Badge()` --calls--> `useFontScale()`  [INFERRED]
  C:\projects\nearnest\web-portal\apps\mobile\components\Badge.tsx → C:\projects\nearnest\web-portal\apps\mobile\hooks\useFontScale.ts
- `Chip()` --calls--> `useFontScale()`  [INFERRED]
  C:\projects\nearnest\web-portal\apps\mobile\components\Chip.tsx → C:\projects\nearnest\web-portal\apps\mobile\hooks\useFontScale.ts
- `OfflineBanner()` --calls--> `useFontScale()`  [INFERRED]
  C:\projects\nearnest\web-portal\apps\mobile\components\OfflineBanner.tsx → C:\projects\nearnest\web-portal\apps\mobile\hooks\useFontScale.ts
- `SearchBar()` --calls--> `useFontScale()`  [INFERRED]
  C:\projects\nearnest\web-portal\apps\mobile\components\SearchBar.tsx → C:\projects\nearnest\web-portal\apps\mobile\hooks\useFontScale.ts
- `StaleDataBanner()` --calls--> `useFontScale()`  [INFERRED]
  C:\projects\nearnest\web-portal\apps\mobile\components\StaleDataBanner.tsx → C:\projects\nearnest\web-portal\apps\mobile\hooks\useFontScale.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (36): buildMockAvailabilityMap(), buildResultGroups(), ensureCategory(), ensureInventoryItem(), ensureMedicine(), ensureStore(), ensureStoreInventoryGroup(), filterToBackend() (+28 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (24): AdminLayout(), Icon(), useClickAway(), RoleRedirect(), useAuth(), CreateStore(), DocumentVerification(), Icon() (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (40): getAuthErrorMessage(), reloadCurrentUser(), sendVerificationEmailToCurrentUser(), signInWithEmail(), signInWithGoogleIdToken(), signOut(), signUpWithEmail(), subscribeToAuthState() (+32 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (43): asStringArray(), buildQueryTokens(), compareAvailability(), decodePolyline(), decodePolylineValue(), distanceForStore(), encodeGeohash(), fetchStoreDocsByGeohash() (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (17): formatFreshness(), requestCurrentLocation(), toUserLocation(), watchUserLocation(), formatFreshness(), buildFallbackRoute(), decodePolyline(), decodePolylineValue() (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (6): openExternalUrl(), openPhone(), openPhone(), getPhoneUrl(), callStore(), openPhone()

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (13): createStore(), docToStore(), ensureAddressShape(), getFirebaseProjectId(), getMembersMapFieldPath(), getStore(), isAdmin(), isDevMode() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (8): Badge(), Chip(), getRecentSearches(), OfflineBanner(), ProfileScreen(), SearchBar(), StaleDataBanner(), useFontScale()

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (7): RequireProfile(), initials(), prettyAddress(), StoreCard(), useAvatarMenu(), UserHome(), useProfileComplete()

### Community 9 - "Community 9"
Cohesion: 0.44
Nodes (10): fetch_batch(), first_string(), infer_categories(), infer_form(), list_strings(), main(), normalize_record(), slugify() (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.31
Nodes (8): assertStoreDocsSafe(), buildSearchTokens(), encodeGeohash(), freshnessLabel(), item(), main(), medicine(), store()

### Community 11 - "Community 11"
Cohesion: 0.31
Nodes (6): Card(), Dashboard(), Icon(), KPICard(), makeMonthBuckets(), RangeTabs()

### Community 12 - "Community 12"
Cohesion: 0.31
Nodes (5): deleteStore(), listStores(), mockDelay(), normalizeStore(), setStoreStatus()

### Community 13 - "Community 13"
Cohesion: 0.46
Nodes (6): buildRange(), formatDate(), Icon(), Pagination(), StatusPill(), StoresPage()

### Community 14 - "Community 14"
Cohesion: 0.6
Nodes (3): Analytics(), downloadCSV(), renderPercentLabel()

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (2): buildDayBuckets(), StoreAdminDashboard()

### Community 16 - "Community 16"
Cohesion: 0.4
Nodes (0):

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (2): getNow(), SupportDashboard()

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (2): buildRegion(), coordinateForStore()

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (0):

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (2): fetchRoles(), redirectByRole()

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (1): Inventory()

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (2): formatBytes(), StoreAdvertisement()

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (0):

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (2): getParamValue(), ResultsScreen()

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (0):

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (0):

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (1): MainContent()

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (1): NavBar()

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (1): Sidebar()

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (0):

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (1): StoreSupportHelp()

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (1): StoreAdminHome()

### Community 33 - "Community 33"
Cohesion: 0.67
Nodes (1): StoreSettings()

### Community 34 - "Community 34"
Cohesion: 0.67
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

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0):

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0):

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0):

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0):

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0):

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0):

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0):

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0):

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0):

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0):

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0):

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (0):

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (0):

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (0):

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (0):

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (0):

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (0):

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (0):

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (0):

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (0):

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (0):

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (0):

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (0):

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (0):

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (0):

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (0):

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (0):

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (0):

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (0):

### Community 79 - "Community 79"
Cohesion: 1.0
Nodes (0):

### Community 80 - "Community 80"
Cohesion: 1.0
Nodes (0):

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 35`** (2 nodes): `phone-otp.tsx`, `PhoneOtpScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `welcome.tsx`, `handlePrimaryPress()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `_layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `[categoryId].tsx`, `getParamValue()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `[medicineId].tsx`, `getParamValue()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `BottomSheet()`, `BottomSheet.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `InfoCard.tsx`, `InfoCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `ModeToggle.tsx`, `ModeToggle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `withAndroidGoogleMapsApiKey.js`, `setMapsApiKey()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `phoneAuth.ts`, `normalizeIndianMobileNumber()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `verifyDiscoveryData.js`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `App()`, `App.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `NearnestHome.jsx`, `NearNestHome()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `AdminDashboard()`, `AdminDashboard.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `Notifications.jsx`, `Notifications()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `RolePermission.jsx`, `RolePermission()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `Settings.jsx`, `Settings()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `StoreManagement.jsx`, `StoreManagement()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (2 nodes): `SignUp.jsx`, `SignUp()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (2 nodes): `VerifyEmail.jsx`, `VerifyEmail()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `landing.jsx`, `Landing()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (2 nodes): `RegisterStore.jsx`, `RegisterStore()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (2 nodes): `StoreForm.jsx`, `StoreForm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (2 nodes): `SupportAnalytics.jsx`, `SupportAnalytics()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `SupportHome.jsx`, `SupportHome()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `app.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `index.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `privacy.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `terms.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `ActionButton.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `CategoryCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `EmptyState.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `ErrorState.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `MapPlaceholder.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `ProductCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `Screen.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `telemetry.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `discovery.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `firebase-auth-react-native.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (1 nodes): `seedFirestore.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `firebase.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (1 nodes): `firebase.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getPhoneUrl()` connect `Community 5` to `Community 0`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `getAvailabilityForMedicine()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `formatFreshness()` connect `Community 4` to `Community 3`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `useAuth()` (e.g. with `AdminLayout()` and `SupportTickets()`) actually correct?**
  _`useAuth()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `upsertUserProfileFromAuthUser()` (e.g. with `signInWithEmail()` and `signUpWithEmail()`) actually correct?**
  _`upsertUserProfileFromAuthUser()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `getAuthErrorMessage()` (e.g. with `completeGoogleSignIn()` and `handleEmailSignIn()`) actually correct?**
  _`getAuthErrorMessage()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
