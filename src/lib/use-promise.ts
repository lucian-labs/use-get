import { useEffect, useRef, useState } from "react";
import { LOADING, State, toMessage } from "./state";

type Res<T> =
  | { data: T; error: null; loading: false }
  | { data: null; error: null; loading: true }
  | { data: null; error: string; loading: false };

/**
 * Tracks the result of `fn()`. It takes a factory plus a dependency array
 * rather than a live promise: promise identity changes on every render when the
 * call is written inline, which meant one new request per render and, on
 * rejection, an unbounded loop. `deps` decides when to run, exactly like
 * useEffect.
 */
export const usePromise = <T>(
  fn: () => Promise<T>,
  deps: unknown[] = []
): Res<T> => {
  const [state, setState] = useState<State<T>>(LOADING);

  // Call the newest factory, but only when deps say to.
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    setState(LOADING);

    // Handlers are attached synchronously with the call, so a promise that
    // settles immediately cannot escape as an unhandled rejection.
    fnRef.current().then(
      (data) => {
        if (!cancelled) setState({ status: "success", data, error: null });
      },
      (err) => {
        if (!cancelled)
          setState({ status: "error", data: null, error: toMessage(err) });
      }
    );

    return () => {
      cancelled = true;
    };
  }, deps);

  if (state.status === "error")
    return { data: null, error: state.error, loading: false };
  if (state.status === "success")
    return { data: state.data, error: null, loading: false };
  return { data: null, error: null, loading: true };
};
