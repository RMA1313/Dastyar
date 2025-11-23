import React from 'react';
import { render, screen } from '@testing-library/react';
import TextPart from '../Parts/Text';

jest.mock('../Markdown', () => ({ content }: { content: string }) => <div>{content}</div>);
jest.mock('../MarkdownLite', () => ({ content }: { content: string }) => <div>{content}</div>);

jest.mock('~/Providers', () => ({
  useMessageContext: () => ({ isSubmitting: true, isLatestMessage: true }),
}));

jest.mock('recoil', () => ({
  useRecoilValue: () => false,
}));

jest.mock('~/store', () => ({
  enableUserMsgMarkdown: {},
}));

jest.mock('~/utils', () => {
  const direction = jest.requireActual('~/utils/direction');
  return {
    ...direction,
    cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  };
});

describe('TextPart RTL handling', () => {
  it('renders RTL direction and streaming indicator state for Persian text', () => {
    render(<TextPart text="سلام دنیا" showCursor={true} isCreatedByUser={false} />);

    const textNode = screen.getByText('سلام دنیا');
    const container = textNode.closest('[dir]');

    expect(container?.getAttribute('dir')).toBe('rtl');
    expect(container?.className).toContain('result-streaming');
    expect(container).toHaveStyle({ textAlign: 'right' });
  });
});
