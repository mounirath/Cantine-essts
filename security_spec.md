# Security Specification & Threat Model

## 1. Data Invariants

1. **Isolation of Reservations**: Only the creator of a reservation (matching `request.auth.uid` or an administrator/staff cashier) may update or delete their reservation.
2. **Terminal State Locking**: Once a reservation is marked as `served`, its state cannot be toggled back or altered by an unprivileged agent.
3. **Immutability of Key Fields**: `id`, `date`, `createdAt`, `userId`, `ticketCode` cannot be modified once written.
4. **Input Size & Injection Boundaries**: All string identifiers and textual fields have strict `size()` constraints and alphanumeric regex limits where applicable.
5. **Admin Authority**: Only authenticated administrators (whose email is `rita68dz@gmail.com` with `email_verified == true`, or registered in `/admins/{uid}`) can alter global settings, edit official menus, or modify user authorization privileges.
6. **No Blanket Reads**: Sensitive agent data and full reservation listings cannot be scraped without authentication and role filters.

## 2. The Dirty Dozen Attack Payloads

1. **Payload 1 (Ghost Field Injection)**:
   - Target: `/reservations/{resId}`
   - Attack: Adding `isAdmin: true` or `bypassed: true` into the reservation body.
   - Expected: `PERMISSION_DENIED` via `hasOnly()` checks.

2. **Payload 2 (Unverified Email Admin Spoofing)**:
   - Target: `/menus/{menuId}`
   - Attack: Auth token with email `rita68dz@gmail.com` but `email_verified: false`.
   - Expected: `PERMISSION_DENIED`.

3. **Payload 3 (Oversized Denial-of-Wallet Payload)**:
   - Target: `/reservations/{resId}`
   - Attack: `dietaryNotes` string containing a 2MB spam buffer.
   - Expected: `PERMISSION_DENIED` via string length enforcement `<= 300`.

4. **Payload 4 (Identity Theft / UID Spoofing)**:
   - Target: `/reservations/{resId}`
   - Attack: User A creates a reservation with `userId: "user_B"`.
   - Expected: `PERMISSION_DENIED` because `incoming().userId == request.auth.uid`.

5. **Payload 5 (Terminal State Bypass / Re-serving)**:
   - Target: `/reservations/{resId}`
   - Attack: Changing a `status: "served"` reservation back to `"confirmed"` to get double meals.
   - Expected: `PERMISSION_DENIED`.

6. **Payload 6 (Self-Assigned Admin Role)**:
   - Target: `/admins/{uid}`
   - Attack: Regular authenticated user writing a doc into `/admins/{theirUid}`.
   - Expected: `PERMISSION_DENIED`.

7. **Payload 7 (Path Injection / ID Poisoning)**:
   - Target: `/reservations/../../../evil_path`
   - Attack: Malicious document IDs with invalid characters or traversal attempts.
   - Expected: `PERMISSION_DENIED` via `isValidId()`.

8. **Payload 8 (Menu Tampering by Non-Admin)**:
   - Target: `/menus/{menuId}`
   - Attack: Regular user attempting `create`, `update`, or `delete` on daily menu.
   - Expected: `PERMISSION_DENIED`.

9. **Payload 9 (Date Format Corruption)**:
   - Target: `/reservations/{resId}`
   - Attack: Date set to `"invalid-date"` instead of `YYYY-MM-DD`.
   - Expected: `PERMISSION_DENIED` via regex verification.

10. **Payload 10 (Immutability Violation on Update)**:
    - Target: `/reservations/{resId}`
    - Attack: Changing `ticketCode` or `createdAt` during an update.
    - Expected: `PERMISSION_DENIED`.

11. **Payload 11 (Settings Tampering)**:
    - Target: `/settings/general`
    - Attack: Unauthenticated or non-admin writing arbitrary capacity limits.
    - Expected: `PERMISSION_DENIED`.

12. **Payload 12 (Unauthorized Deletion of Other User's Ticket)**:
    - Target: `/reservations/{resId}`
    - Attack: Authenticated user attempting to cancel or delete another user's reservation.
    - Expected: `PERMISSION_DENIED`.
