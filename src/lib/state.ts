/** Internal request state shared by both hooks. One value rather than separate
 *  data/error signals, so a render can never see stale data next to an error,
 *  and so "resolved to a falsy value" is distinguishable from "never resolved". */
export type State<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string };

/** Shared instance: re-entering the loading state is then reference-equal and
 *  React bails out of the re-render instead of looping. */
export const LOADING: { status: "loading"; data: null; error: null } = {
  status: "loading",
  data: null,
  error: null,
};

/** A catch binding is unknown, but the public union promises a string. */
export const toMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);
