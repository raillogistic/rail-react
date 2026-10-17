/** Template metadata cannot direct credential-bearing requests to a foreign origin. */
import { afterEach, expect, it, vi } from 'vitest';
import { executeTemplateForRows } from '../templateExecution';

vi.mock('@/shared/config/backend-endpoint', () => ({ getRuntimeBackendConfig: () => ({ backendUrl: 'https://backend.example' }) }));
vi.mock('@/shared/api/auth/token-storage', () => ({
  getAuthorizationHeader: () => 'Bearer synthetic', getSecureHeaders: () => ({ 'X-CSRFToken': 'synthetic' }),
}));
afterEach(() => vi.unstubAllGlobals());

it('rejects external template destinations without making a request', async () => {
  const request = vi.fn();
  vi.stubGlobal('fetch', request);
  await expect(executeTemplateForRows({ key: 'report', title: 'Report', endpoint: 'https://untrusted.example/report', templateType: 'pdf' }, ['1'])).rejects.toThrow(/destination/);
  expect(request).not.toHaveBeenCalled();
});

it('keeps backend template requests and previews working', async () => {
  const blob = new Blob(['synthetic pdf']);
  const request = vi.fn().mockResolvedValue({ ok: true, headers: new Headers(), blob: async () => blob });
  vi.stubGlobal('fetch', request);
  const preview = vi.fn();
  await expect(executeTemplateForRows({ key: 'report', title: 'Report', endpoint: '/api/v1/templates/report/<pk>/', templateType: 'pdf' }, ['1'], {}, { onPdfPreview: preview })).resolves.toEqual({ templateType: 'pdf', count: 1 });
  expect(request).toHaveBeenCalledWith('https://backend.example/api/v1/templates/report/1/', expect.objectContaining({ headers: { Authorization: 'Bearer synthetic', 'X-CSRFToken': 'synthetic' } }));
  expect(preview).toHaveBeenCalledOnce();
});
