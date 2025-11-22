import { useState, useId, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import * as Ariakit from '@ariakit/react';
import { Upload, Share2 } from 'lucide-react';
import { DropdownPopup, TooltipAnchor, useMediaQuery } from '@librechat/client';
import type * as t from '~/common';
import ExportModal from '~/components/Nav/ExportConversation/ExportModal';
import { ShareButton } from '~/components/Conversations/ConvoOptions';
import { useLocalize } from '~/hooks';
import store from '~/store';

export default function ExportAndShareMenu({
  isSharedButtonEnabled,
}: {
  isSharedButtonEnabled: boolean;
}) {
  const localize = useLocalize();
  const [showExports, setShowExports] = useState(false);
  const [isPopoverActive, setIsPopoverActive] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const menuId = useId();
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const conversation = useRecoilValue(store.conversationByIndex(0));

  const exportable =
    conversation &&
    conversation.conversationId != null &&
    conversation.conversationId !== 'new' &&
    conversation.conversationId !== 'search';

  if (exportable === false) {
    return null;
  }

  const shareHandler = () => {
    setShowShareDialog(true);
  };

  const exportHandler = () => {
    setShowExports(true);
  };

  const dropdownItems: t.MenuItemProps[] = [
    {
      label: localize('com_ui_share'),
      onClick: shareHandler,
      icon: <Share2 className="icon-md mr-2 text-text-secondary" />,
      show: isSharedButtonEnabled,
      /** NOTE: THE FOLLOWING PROPS ARE REQUIRED FOR MENU ITEMS THAT OPEN DIALOGS */
      hideOnClick: false,
      ref: shareButtonRef,
      render: (props) => <button {...props} />,
    },
    {
      label: localize('com_endpoint_export'),
      onClick: exportHandler,
      icon: <Upload className="icon-md mr-2 text-text-secondary" />,
      /** NOTE: THE FOLLOWING PROPS ARE REQUIRED FOR MENU ITEMS THAT OPEN DIALOGS */
      hideOnClick: false,
      ref: exportButtonRef,
      render: (props) => <button {...props} />,
    },
  ];

  return (
    <>
      <DropdownPopup
        portal={true}
        menuId={menuId}
        focusLoop={true}
        unmountOnHide={true}
        isOpen={isPopoverActive}
        setIsOpen={setIsPopoverActive}
        trigger={
          <TooltipAnchor
            description={localize('com_endpoint_export_share')}
            render={
              <Ariakit.MenuButton
                id="export-menu-button"
                aria-label="Export options"
                className="inline-flex size-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/85 text-slate-800 shadow-md shadow-slate-200/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-[1px] hover:border-sky-200 hover:bg-white/95 hover:shadow-2xl hover:shadow-sky-200/60 disabled:pointer-events-none disabled:opacity-50 dark:border-white/10 dark:bg-slate-900/85 dark:text-white dark:shadow-black/30 dark:hover:border-sky-400/50 dark:hover:bg-slate-900/90 radix-state-open:ring-2 radix-state-open:ring-sky-300/80 radix-state-open:ring-offset-2 radix-state-open:ring-offset-white dark:radix-state-open:ring-sky-500/70 dark:radix-state-open:ring-offset-slate-900"
              >
                <Share2
                  className="icon-md text-sky-700 transition-colors dark:text-sky-300"
                  aria-hidden="true"
                  focusable="false"
                />
              </Ariakit.MenuButton>
            }
          />
        }
        items={dropdownItems}
        className={isSmallScreen ? '' : 'absolute right-0 top-0 mt-2'}
      />
      <ExportModal
        open={showExports}
        onOpenChange={setShowExports}
        conversation={conversation}
        triggerRef={exportButtonRef}
        aria-label={localize('com_ui_export_convo_modal')}
      />
      <ShareButton
        triggerRef={shareButtonRef}
        conversationId={conversation.conversationId ?? ''}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </>
  );
}
