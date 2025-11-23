import { render } from '@testing-library/react';
import TagManager from 'react-gtm-module';
import Footer from '../Footer';
import { useGetStartupConfig } from '~/data-provider';

jest.mock('react-gtm-module', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
  },
}));

jest.mock('~/data-provider', () => ({
  useGetStartupConfig: jest.fn(),
}));

describe('Footer (hidden)', () => {
  beforeEach(() => {
    (TagManager.initialize as jest.Mock).mockClear();
    (useGetStartupConfig as jest.Mock).mockReturnValue({
      data: { analyticsGtmId: 'GTM-TEST' },
    });
    // ensure GTM is not already initialized in the test env
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).google_tag_manager = undefined;
  });

  it('initializes Tag Manager without rendering UI', () => {
    const { container } = render(<Footer />);

    expect(container.firstChild).toBeNull();
    expect(TagManager.initialize).toHaveBeenCalledWith({ gtmId: 'GTM-TEST' });
  });
});
