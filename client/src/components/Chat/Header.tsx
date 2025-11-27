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
      <div className="hide-scrollbar flex w-full flex-wrap items-center justify-between gap-3 overflow-x-auto rounded-2xl border border-black/10 bg-white/60 px-4 py-1.5 shadow-[0_8px_18px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-200 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_10px_26px_rgba(0,0,0,0.35)]">
        <div className={cn('flex items-center gap-2.5', isRTL ? 'flex-row-reverse' : 'flex-row')}>
          <OpenSidebar setNavVisible={setNavVisible} className="h-10 w-10" />
          <HeaderNewChat />
          {hasAccessToMultiConvo === true && <AddMultiConvo />}
        </div>
        <div
          className={cn(
            'flex flex-1 flex-wrap items-center justify-end gap-2.5 sm:justify-end',
            isRTL && 'justify-start flex-row-reverse',
          )}
        >
          <ModelSelector
            startupConfig={startupConfig}
            className="min-h-10 rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm shadow-[0_6px_16px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/10 dark:text-gray-100 dark:shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
          />
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
        <div className={cn('flex items-center gap-2.5', isRTL ? 'flex-row-reverse' : 'flex-row')}>
          <ThemeToggle className="h-10 w-10 rounded-lg border border-transparent bg-transparent p-2 text-inherit transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10" />
          {!isSmallScreen && (
            <>
              <ExportAndShareMenu
                isSharedButtonEnabled={startupConfig?.sharedLinksEnabled ?? false}
              />
              <TemporaryChat />
            </>
          )}
        </div>
      </div>
      <div className="h-px w-full bg-black/5 dark:bg-white/10" />
    </div>
  );
}
