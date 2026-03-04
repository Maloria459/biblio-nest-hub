

## Problem

The `reading_sessions` table has `duration_minutes` as an **integer** column, but the code sends a fractional value (e.g., `0.18`) via `Math.round(durationMinutes * 100) / 100`. This causes a Postgres error: `invalid input syntax for type integer: "0.18"`.

## Fix

In `src/components/ReadingSessionTimer.tsx`, change the `duration_minutes` value to use `Math.round(durationMinutes)` instead of `Math.round(durationMinutes * 100) / 100`, so it always sends a whole integer to the database.

**File**: `src/components/ReadingSessionTimer.tsx`  
**Line ~97**: Change `Math.round(durationMinutes * 100) / 100` to `Math.round(durationMinutes)`

This is a one-line fix.

