---
trigger: always_on
---

## Version Naming Rule

### Base Format
```

vX.Y.Z[-tail]

````

- `X`, `Y`, `Z` → semantic version components  
- `tail` → optional suffix (e.g., `alpha`, `beta`, `dev`, `test`, etc.)

---

### Automatic Test Versioning Rule (On Push to Origin)

When pushing to origin, **always normalize the version to a test version**, regardless of whether a tail exists.

1. Start from the provided version:
   - If version is:
     ```
     vX.Y.Z
     ```
     → use as-is
   - If version is:
     ```
     vX.Y.Z-tail
     ```
     → **strip the tail**, resulting in:
     ```
     vX.Y.Z
     ```

2. Convert to test version format:
````

vX.Y.Z-testN

````

3. Determine the value of `N`:
- If **no prior test versions exist** for this base version:
  ```
  N = 0
  ```
- If **test versions already exist** (e.g., `-test0`, `-test1`, ...):
  ```
  N = (highest existing test index) + 1
  ```

---

### Examples

- `v1.2.3` → `v1.2.3-test0`  
- `v1.2.3` (next push) → `v1.2.3-test1`  
- `v1.2.3-beta` → `v1.2.3-test0`  
- `v1.2.3-dev` → `v1.2.3-test1` (if `test0` exists)  
- Existing: `v1.2.3-test0`, `v1.2.3-test1` → `v1.2.3-test2`  

---

### Constraints

- Always **remove any existing tail** before applying test versioning.  
- Always apply `-testN` when pushing to origin.  
- Ensure `N` is **incremented sequentially** per base version.  
- **Follow this rule unless a specific version is explicitly mentioned in the prompt.**