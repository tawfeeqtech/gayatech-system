## 2026-06-16 - [Optimized Client Stats Update]
**Learning:** The `updateClientStats` service was performing an O(Projects * Invoices) check for every invoice/project update. While functional for small datasets, this is a significant bottleneck as the database grows. Additionally, fetching full Mongoose documents for simple sum/count operations adds unnecessary overhead.
**Action:** Use `.select()` to limit fields fetched from MongoDB. Use a `Set` for O(1) lookups when checking relationships between collections in memory, reducing overall complexity to O(N + M).
