import { useMemo } from 'react';
import { useMediaQuery } from '@librechat/client';
import { useOutletContext } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { getConfigDefaults, PermissionTypes, Permissions } from 'librechat-data-provider';
import type { ContextType } from '~/common';
import ModelSelector from './Menus/Endpoints/ModelSelector';
import { PresetsMenu, HeaderNewChat, OpenSidebar } from './Menus';
import { useGetStartupConfig } from '~/data-provider';
import ExportAndShareMenu from './ExportAndShareMenu';
import BookmarkMenu from './Menus/BookmarkMenu';
import { TemporaryChat } from './TemporaryChat';
import AddMultiConvo from './AddMultiConvo';
import { useHasAccess } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';
import ThemeToggle from '~/components/Auth/ThemeToggle';

const defaultInterface = getConfigDefaults().interface;

export default function Header() {
  const { data: startupConfig } = useGetStartupConfig();
  const { setNavVisible } = useOutletContext<ContextType>();
  const chatDirection = useRecoilValue(store.chatDirection);

  const interfaceConfig = useMemo(
    () => startupConfig?.interface ?? defaultInterface,
    [startupConfig],
  );

  const hasAccessToBookmarks = useHasAccess({
    permissionType: PermissionTypes.BOOKMARKS,
    permission: Permissions.USE,
  });

  const hasAccessToMultiConvo = useHasAccess({
    permissionType: PermissionTypes.MULTI_CONVO,
    permission: Permissions.USE,
  });

  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const isRTL = useMemo(
    () => (chatDirection != null ? chatDirection?.toLowerCase() === 'rtl' : false),
    [chatDirection],
  );

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(
        'relative flex w-full flex-col gap-2 text-text-primary dark:text-gray-100 bg-transparent',
        isRTL ? 'text-right' : 'text-left',
      )}
    >
      <div
        data-testid="theme-toggle-anchor"
        className={cn(
          'pointer-events-auto flex items-center',
          isRTL ? 'justify-start' : 'ml-auto justify-end',
        )}
      >
        <ThemeToggle />
      </div>
      <div
        className={cn(
          'hide-scrollbar flex w-full flex-wrap items-center gap-2 overflow-x-auto',
          isRTL
            ? 'flex-row-reverse justify-start pr-16 sm:pr-20'
            : 'flex-row justify-between pr-16 sm:pr-20',
        )}
      >
        <div className={cn('flex items-center gap-3', isRTL ? 'flex-row-reverse' : 'flex-row')}>
          <div className="flex items-center gap-2 bg-transparent">
          </div>
          <OpenSidebar setNavVisible={setNavVisible} className="" />
          <HeaderNewChat />
          {hasAccessToMultiConvo === true && <AddMultiConvo />}
        </div>
        <div
          className={cn(
            'flex flex-1 flex-wrap items-center justify-end gap-2 sm:justify-end',
            isRTL && 'justify-start',
          )}
        >
          <ModelSelector startupConfig={startupConfig} />
          {interfaceConfig.presets === true && interfaceConfig.modelSelect && <PresetsMenu />}
          {hasAccessToBookmarks === true && <BookmarkMenu />}
          {isSmallScreen && (
            <>
              <ExportAndShareMenu
                isSharedButtonEnabled={startupConfig?.sharedLinksEnabled ?? false}
              />
              <TemporaryChat />
            </>
          )}
        </div>
        {!isSmallScreen && (
          <div className={cn('flex items-center gap-2', isRTL ? 'flex-row-reverse' : 'flex-row')}>
            <ExportAndShareMenu
              isSharedButtonEnabled={startupConfig?.sharedLinksEnabled ?? false}
            />
            <TemporaryChat />
          </div>
        )}
      </div>
    </div>
  );
}
