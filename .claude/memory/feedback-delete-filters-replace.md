---
name: Delete smart filters must REPLACE selection, not add
description: When using quick-select filters (score, age, non-favorites) for batch deletion, each filter should replace the previous selection, not accumulate.
type: feedback
---

Smart delete filters (score threshold, age, non-favorites) should REPLACE the current selection, not add to it.

**Why:** User selected "non-favorites" (most of the page), then selected "score below 20" which added more. Since nearly all jobs were non-favorites OR low-score, the entire page was selected. User clicked delete expecting targeted removal but got the whole page deleted. Accumulative selection is dangerous for destructive operations.

**How to apply:** Each filter call should do `this.selectedIds.set(new Set(ids))` instead of creating a union with existing selection. The batch action bar shows the count clearly, but users don't mentally track union accumulation across filter clicks.
