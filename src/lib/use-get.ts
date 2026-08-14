import { useCallback, useEffect, useRef, useState } from "react";
import { LOADING, State, toMessage } from "./state";

type Get = () => Promise<void>;

type Res<T> =
  | { data: T; error: null; loading: false; get: Get }
  | { data: null; error: null; loading: true; get: Get }
  | { data: null; error: string; loading: false; get: Get };

type Props<T> = {
  path: string;
  /** Passed through to fetch — method, headers, credentials, and friends. */
  init?: RequestInit;
  /** Pull the payload out of the parsed body. Defaults to the body itself, so
   *  an API that wraps its responses wants `select: (body) => (body as Env).data`. */
  select?: (body: unknown) => T;
};

export const useGet = <T>({ path, init, select }: Props<T>): Res<T> => {
  const [state, setState] = useState<State<T>>(LOADING);

  // Held in refs because the natural way to write these is inline, which means
  // a new identity every render. Only `path` should retrigger the request.
  const initRef = useRef(init);
  const selectRef = useRef(select);
  initRef.current = init;
  selectRef.current = select;

  const inFlight = useRef<AbortController | null>(null);

  const get = useCallback(async () => {
    // Supersede whatever is already running, so a slow earlier response cannot
    // land on top of a newer one.
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setState(LOADING);

    try {
      const res = await fetch(path, {
        ...initRef.current,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(res.statusText);
      const body = (await res.json()) as unknown;
      // Nothing is validated at runtime, so without `select` the shape of the
      // body is the caller's claim, not ours.
      const data = selectRef.current ? selectRef.current(body) : (body as T);
      if (controller.signal.aborted) return;
      setState({ status: "success", data, error: null });
    } catch (err) {
      // Aborted means superseded or unmounted, not failed.
      if (controller.signal.aborted) return;
      setState({ status: "error", data: null, error: toMessage(err) });
    }
  }, [path]);

  useEffect(() => {
    get();
    return () => inFlight.current?.abort();
  }, [get]);

  if (state.status === "error")
    return { data: null, error: state.error, loading: false, get };
  if (state.status === "success")
    return { data: state.data, error: null, loading: false, get };
  return { data: null, error: null, loading: true, get };
};
