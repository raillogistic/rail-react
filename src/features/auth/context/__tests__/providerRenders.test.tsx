/** Parent updates must not broadcast unchanged authentication state to memoized widgets. */
import React, { memo, useContext } from 'react';
import { render, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { AuthContext, AuthProvider } from '../AuthProvider';

/** Measure observable consumer work after initialization has settled. */
async function countRenders(Provider: typeof AuthProvider, Context: typeof AuthContext): Promise<number> {
  let renders = 0;
  /** A widget only subscribes to authentication, not to its parent's unrelated props. */
  const Widget = memo(function Widget() {
    const auth = useContext(Context);
    renders += 1;
    return <span>{auth?.status}</span>;
  });
  const config = { eventBus: { enableCrossTab: false } };
  const count = process.env.RAIL_PERF_AUTH_BASELINE ? 100 : 1;
  /** Give each consumer stable props while the provider's parent rerenders. */
  const tree = () => <Provider config={config}>{Array.from({ length: count }, (_, id) => <Widget key={id} />)}</Provider>;
  const view = render(tree());
  await waitFor(() => expect(view.getAllByText('unauthenticated')).toHaveLength(count));
  const settled = renders;
  for (let index = 0; index < 30; index++) {
    view.rerender(tree());
  }
  const additional = renders - settled;
  view.unmount();
  return additional;
}

it('preserves the context value across unrelated parent renders', async () => {
  const current = await countRenders(AuthProvider, AuthContext);
  expect(current).toBe(0);
  const source = process.env.RAIL_PERF_AUTH_BASELINE;
  if (source) {
    const original = await import(/* @vite-ignore */ source);
    const baseline = await countRenders(original.AuthProvider, original.AuthContext);
    expect(baseline).toBe(3000);
    const results = { parent_renders: 30, consumers: 100, baseline_consumer_renders: baseline, final_consumer_renders: current };
    const { writeFileSync } = await import('node:fs');
    writeFileSync(process.env.RAIL_PERF_AUTH_OUTPUT!, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results));
  }
});
