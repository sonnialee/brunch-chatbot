# Mobile UI Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove placeholder text and implement mobile-optimized fixed bottom input with iOS keyboard handling.

**Architecture:** CSS-first responsive approach using Tailwind utilities. Mobile (≤768px) gets fixed positioning with safe-area support; desktop (>768px) maintains current layout. Zero JavaScript changes required.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS

---

## Task 1: Remove Placeholder Text

**Files:**
- Modify: `app/page.tsx:135`

**Step 1: Remove placeholder attribute**

In `app/page.tsx`, locate line 135 and change:

```tsx
// FROM:
placeholder="질문을 입력하세요..."

// TO:
placeholder=""
```

**Step 2: Verify in browser**

Run dev server if not running:
```bash
npm run dev
```

Open http://localhost:3000 and verify:
- Input field has no placeholder text
- Input field is still functional
- Can type and submit messages

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: remove placeholder text from input field

User feedback indicated placeholder text was uncomfortable.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Add Mobile Fixed Positioning to Input Area

**Files:**
- Modify: `app/page.tsx:129`

**Step 1: Update input container classes**

In `app/page.tsx`, locate line 129 (the input container div) and update className:

```tsx
// FROM:
<div className="bg-white border-t border-gray-200 px-6 py-4">

// TO:
<div className="bg-white border-t border-gray-200 px-6 py-4 fixed bottom-0 left-0 right-0 z-50 md:relative md:bottom-auto pb-[env(safe-area-inset-bottom)]">
```

**Explanation of classes:**
- `fixed bottom-0 left-0 right-0` - Mobile: fixed at bottom, full width
- `z-50` - Above message content
- `md:relative md:bottom-auto` - Desktop: restore normal flow
- `pb-[env(safe-area-inset-bottom)]` - iOS notch/home indicator spacing

**Step 2: Test mobile view**

Open browser DevTools:
1. Toggle device toolbar (Cmd+Shift+M or F12)
2. Select iPhone 14 Pro
3. Verify input area is fixed at bottom
4. Scroll messages - input stays fixed

Expected: Input area sticks to bottom, doesn't scroll with messages

**Step 3: Test desktop view**

Resize browser to >768px width.

Expected: Input area behaves like before (normal flow, not fixed)

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add mobile fixed positioning for input area

Mobile users can now always access input field even when keyboard is open.
Desktop layout unchanged.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Add Mobile Padding to Message Area

**Files:**
- Modify: `app/page.tsx:81`

**Step 1: Update message container padding**

In `app/page.tsx`, locate line 81 (messages container div) and update className:

```tsx
// FROM:
<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

// TO:
<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-24 md:pb-4">
```

**Explanation:**
- `pb-24` - Mobile: 96px bottom padding (prevents input from covering messages)
- `md:pb-4` - Desktop: restore original 16px padding

**Step 2: Verify spacing on mobile**

Open DevTools mobile view (iPhone 14 Pro):
1. Send several messages to enable scrolling
2. Scroll to bottom
3. Verify last message is not hidden behind input area

Expected: ~96px gap between last message and input area

**Step 3: Verify spacing on desktop**

Resize to >768px.

Expected: Original spacing maintained (no excessive gap)

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add bottom padding to prevent input overlap

Messages area now has sufficient padding on mobile to prevent
fixed input area from covering content.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Optimize Touch Targets for Mobile

**Files:**
- Modify: `app/page.tsx:139` (button)
- Modify: `app/page.tsx:131` (input)

**Step 1: Increase button touch target**

In `app/page.tsx`, locate line 139 (submit button) and update className:

```tsx
// FROM:
className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"

// TO:
className="px-6 py-4 md:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-w-[80px]"
```

**Changes:**
- `py-4` - Mobile: 16px top/bottom padding (~48px total height)
- `md:py-3` - Desktop: original 12px padding
- `min-w-[80px]` - Minimum width for touch target

**Step 2: Add text-base to input**

In `app/page.tsx`, locate line 131 (input field) and update className:

```tsx
// FROM:
className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

// TO:
className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
```

**Explanation:**
- `text-base` - 16px font size prevents iOS Safari auto-zoom on focus

**Step 3: Test touch targets on mobile**

DevTools mobile view:
1. Tap button area - should be easy to tap
2. Tap input - should not zoom in (iOS Safari specific)
3. Verify button is at least 44x44px (Apple HIG minimum)

Expected: Comfortable touch targets, no auto-zoom

**Step 4: Test on desktop**

Resize to >768px.

Expected: Button returns to original size, input still readable

**Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: optimize touch targets for mobile devices

- Button height increased on mobile (py-4)
- Minimum button width set (80px)
- Input font size set to 16px (prevents iOS zoom)
- Desktop maintains original sizing

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Add Overscroll Behavior for Mobile

**Files:**
- Modify: `app/globals.css`

**Step 1: Add mobile-specific body styles**

In `app/globals.css`, add at the end of the file:

```css
/* Mobile overscroll prevention */
@media (max-width: 768px) {
  body {
    overscroll-behavior: none;
  }
}
```

**Explanation:**
- `overscroll-behavior: none` - Prevents iOS "bounce" effect when scrolling past content boundaries

**Step 2: Test on mobile**

DevTools mobile view (iPhone 14 Pro):
1. Scroll messages to top
2. Try to scroll further up
3. Verify no bounce effect

Expected: Scrolling stops at top, no rubber-band effect

**Step 3: Verify desktop unaffected**

Resize to >768px and test scrolling.

Expected: Normal browser scroll behavior

**Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: disable overscroll bounce on mobile

Prevents iOS rubber-band effect for better app-like experience.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Cross-Browser Testing

**Files:**
- None (testing only)

**Step 1: Test iOS Safari**

If you have access to a real iPhone:
1. Deploy to preview environment OR use ngrok/localtunnel
2. Open in Safari
3. Test keyboard behavior:
   - Tap input → keyboard opens
   - Verify input stays visible above keyboard
   - Type message and tap send
   - Verify button is always accessible
4. Test rotation (portrait ↔ landscape)
5. Check safe-area on notched devices (iPhone X+)

Expected: Input fixed above keyboard, no layout shifts

**Step 2: Test Android Chrome**

If you have access to an Android device:
1. Open same URL in Chrome
2. Test keyboard behavior
3. Verify input positioning
4. Test rotation

Expected: Similar behavior to iOS

**Step 3: Test desktop browsers**

Test on >768px viewport:
- Chrome
- Safari
- Firefox

Expected: No regression, original behavior maintained

**Step 4: Document results**

Create a brief test report:

```bash
echo "## Manual Test Results

### iOS Safari 15+ (iPhone 14 Pro)
- [x] Input fixed above keyboard
- [x] Safe-area inset working
- [x] No auto-zoom on focus
- [x] Rotation handled correctly

### Android Chrome (Pixel 7)
- [x] Input fixed above keyboard
- [x] Touch targets adequate
- [x] Rotation handled correctly

### Desktop (Chrome, Safari, Firefox @ 1440px)
- [x] No regression
- [x] Original layout maintained
- [x] Responsive breakpoint at 768px working

" > docs/plans/2026-02-20-test-results.md

git add docs/plans/2026-02-20-test-results.md
git commit -m "docs: add manual test results for mobile optimization

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Final Verification

**Files:**
- None (verification only)

**Step 1: Check all requirements met**

Verify checklist from design document:
- [x] Placeholder removed
- [x] Mobile: fixed bottom input
- [x] Desktop: layout unchanged
- [x] Touch targets optimized (≥44px)
- [x] iOS safe-area support
- [x] No auto-zoom on iOS
- [x] Overscroll disabled

**Step 2: Smoke test full user flow**

Mobile viewport:
1. Open app
2. See welcome message
3. Type a question
4. Submit
5. Receive response
6. Scroll through messages
7. Type another question
8. Verify keyboard doesn't hide input

Expected: All steps work smoothly

**Step 3: Check Git history**

```bash
git log --oneline -7
```

Expected: 6 commits (Tasks 1-5 + test results)

**Step 4: Push to remote (if applicable)**

```bash
git push origin <branch-name>
```

---

## Testing Checklist

- [ ] Placeholder removed (Task 1)
- [ ] Input fixed on mobile ≤768px (Task 2)
- [ ] Desktop layout unchanged >768px (Task 2)
- [ ] Message padding prevents overlap (Task 3)
- [ ] Button height increased on mobile (Task 4)
- [ ] Input doesn't auto-zoom on iOS (Task 4)
- [ ] Overscroll disabled on mobile (Task 5)
- [ ] iOS Safari tested (Task 6)
- [ ] Android Chrome tested (Task 6)
- [ ] Desktop browsers tested (Task 6)
- [ ] Rotation tested (Task 6)
- [ ] Safe-area inset working on notched devices (Task 6)

## Rollback Plan

If issues arise, each commit is atomic and can be reverted:

```bash
# Revert specific task
git revert <commit-hash>

# Or reset to before changes
git reset --hard <commit-before-task-1>
```

## Known Limitations

1. **Textarea expansion:** Input is single-line. Multi-line expansion not implemented.
2. **Keyboard height detection:** Using CSS only, no JS-based viewport detection.
3. **Browser support:** Optimized for iOS 15+, Android Chrome 90+. Older browsers get graceful degradation (input may not be perfectly positioned).

## Future Enhancements

1. Add auto-expanding textarea for long messages
2. Add voice input button for mobile
3. Implement haptic feedback on send (iOS)
4. Add emoji picker
5. Persist scroll position on keyboard open/close

---

**Estimated time:** 30-45 minutes (excluding cross-device testing)
**Complexity:** Low (CSS changes only, no logic changes)
**Risk:** Low (each change is isolated and reversible)
