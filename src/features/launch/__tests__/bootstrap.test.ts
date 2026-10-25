import { ensureToken, queryClient } from '@/services/api';

import { bootstrap } from '../bootstrap';

jest.mock('@/services/api', () => ({
  ensureToken: jest.fn(),
  queryClient: { prefetchInfiniteQuery: jest.fn(() => Promise.resolve()), getQueryData: jest.fn() },
}));
jest.mock('@/services/api/queries', () => ({
  feedQuery: () => ({ queryKey: ['feed'] }),
  catalogueQuery: () => ({ queryKey: ['games'] }),
}));

const mockedEnsureToken = jest.mocked(ensureToken);
const mockedPrefetch = jest.mocked(queryClient.prefetchInfiniteQuery);

describe('bootstrap', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens the app straight away when the guest session cannot be created', async () => {
    mockedEnsureToken.mockRejectedValue(new Error('HTTP 500'));
    const phases: string[] = [];

    await bootstrap((p) => phases.push(p));

    expect(phases).toEqual(['connecting', 'ready']);
    expect(mockedPrefetch).not.toHaveBeenCalled();
  });

  it('prefetches the feed and catalogue once, without retry backoff', async () => {
    mockedEnsureToken.mockResolvedValue('token');
    const phases: string[] = [];

    await bootstrap((p) => phases.push(p));

    expect(phases).toEqual(['connecting', 'dealing', 'ready']);
    expect(mockedPrefetch).toHaveBeenCalledTimes(2);
    for (const [options] of mockedPrefetch.mock.calls) expect(options).toMatchObject({ retry: 0 });
  });
});
