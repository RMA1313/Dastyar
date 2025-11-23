import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../Header';

jest.mock('~/data-provider', () => ({
  useGetStartupConfig: () => ({ data: { interface: { presets: false, modelSelect: false } } }),
}));

jest.mock('~/components/Chat/Menus/Endpoints/ModelSelector', () => () => (
  <div data-testid="model-selector" />
));
jest.mock('~/components/Chat/Menus', () => ({
  PresetsMenu: () => <div data-testid="presets-menu" />,
  HeaderNewChat: () => <div data-testid="new-chat" />,
  OpenSidebar: () => <div data-testid="open-sidebar" />,
}));
jest.mock('~/components/Chat/Menus/BookmarkMenu', () => () => <div data-testid="bookmark-menu" />);
jest.mock('~/components/Chat/ExportAndShareMenu', () => () => <div data-testid="export-menu" />);
jest.mock('~/components/Chat/TemporaryChat', () => ({
  TemporaryChat: () => <div data-testid="temporary-chat" />,
}));
jest.mock('~/components/Chat/AddMultiConvo', () => () => <div data-testid="add-multi-convo" />);
jest.mock('~/hooks', () => ({
  useHasAccess: () => false,
}));
jest.mock('@librechat/client', () => ({
  useMediaQuery: () => false,
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useOutletContext: () => ({ setNavVisible: jest.fn() }),
}));
jest.mock('recoil', () => ({
  useRecoilValue: () => 'rtl',
}));
jest.mock('~/store', () => ({
  chatDirection: {},
}));
jest.mock('~/components/Auth/ThemeToggle', () => () => <div data-testid="theme-toggle" />);

describe('Header theme toggle positioning', () => {
  it('anchors theme toggle absolutely in the navbar for RTL layout', () => {
    render(<Header />);

    const anchor = screen.getByTestId('theme-toggle-anchor');
    expect(anchor.className).toContain('absolute');
    expect(anchor.className).toContain('left-3');
    expect(anchor).toContainElement(screen.getByTestId('theme-toggle'));
    const bar = screen.getByTestId('model-selector').parentElement?.parentElement;
    expect(bar?.className).toContain('pr-16');
  });
});
