---
name: Orval generated fetch typings
description: TypeScript DOM library requirement for generated API client code.
---

Keep `dom.iterable` included in the API client TypeScript `lib` list.

**Why:** Orval's generated fetch client calls `Headers.entries()`, which TypeScript does not expose with only `dom` and `es2022`.

**How to apply:** Preserve `dom.iterable` whenever adjusting the API client's TypeScript compiler settings or regenerating API hooks.
