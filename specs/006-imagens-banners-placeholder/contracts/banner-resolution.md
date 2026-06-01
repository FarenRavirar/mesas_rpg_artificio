# Contract: Banner Resolution

## Goal

All public and dashboard surfaces resolve table banners through one frontend contract.

## Inputs

```ts
type ResolveTableImageInput = {
  src?: string | null;
  title: string;
  fallbackSrc?: string;
};
```

## Output

```ts
type ResolvedTableImage = {
  src: string;
  fallbackSrc: string;
  alt: string;
  onError: (event: React.SyntheticEvent<HTMLImageElement>) => void;
};
```

## Required Behavior

- If `src` is empty, use the canonical banner placeholder.
- If browser loading fails, switch to the canonical banner placeholder exactly once.
- Components may choose dimensions, object-fit and crop styles, but not invent a different fallback rule.
- The same contract must be used by:
  - `TableCard`
  - `TableCardDashboard`
  - `MestreFeaturedTable`
  - `TableHero`
  - any new table banner surface added during this feature

## Non-Goals

- This contract does not upload images.
- This contract does not decide whether a URL is durable.
- This contract does not change certification badge behavior.
