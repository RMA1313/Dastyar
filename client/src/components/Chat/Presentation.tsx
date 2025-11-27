import { useRecoilValue } from 'recoil';
import { useEffect, useMemo } from 'react';
import { FileSources, LocalStorageKeys } from 'librechat-data-provider';
import type { ExtendedFile } from '~/common';
import { useDeleteFilesMutation } from '~/data-provider';
import DragDropWrapper from '~/components/Chat/Input/Files/DragDropWrapper';
import { EditorProvider, SidePanelProvider, ArtifactsProvider } from '~/Providers';
import Artifacts from '~/components/Artifacts/Artifacts';
import { SidePanelGroup } from '~/components/SidePanel';
import { useSetFilesToDelete } from '~/hooks';
import store from '~/store';

export default function Presentation({ children }: { children: React.ReactNode }) {
  const artifacts = useRecoilValue(store.artifactsState);
  const artifactsVisibility = useRecoilValue(store.artifactsVisibility);
  const chatDirection = useRecoilValue(store.chatDirection);

  const setFilesToDelete = useSetFilesToDelete();

  const { mutateAsync } = useDeleteFilesMutation({
    onSuccess: () => {
      console.log('Temporary Files deleted');
      setFilesToDelete({});
    },
    onError: (error) => {
      console.log('Error deleting temporary files:', error);
    },
  });

  useEffect(() => {
    const filesToDelete = localStorage.getItem(LocalStorageKeys.FILES_TO_DELETE);
    const map = JSON.parse(filesToDelete ?? '{}') as Record<string, ExtendedFile>;
    const files = Object.values(map)
      .filter(
        (file) =>
          file.filepath != null && file.source && !(file.embedded ?? false) && file.temp_file_id,
      )
      .map((file) => ({
        file_id: file.file_id,
        filepath: file.filepath as string,
        source: file.source as FileSources,
        embedded: !!(file.embedded ?? false),
      }));

    if (files.length === 0) {
      return;
    }
    mutateAsync({ files });
  }, [mutateAsync]);

  const defaultLayout = useMemo(() => {
    const resizableLayout = localStorage.getItem('react-resizable-panels:layout');
    return typeof resizableLayout === 'string' ? JSON.parse(resizableLayout) : undefined;
  }, []);
  const defaultCollapsed = useMemo(() => {
    const collapsedPanels = localStorage.getItem('react-resizable-panels:collapsed');
    return typeof collapsedPanels === 'string' ? JSON.parse(collapsedPanels) : true;
  }, []);
  const fullCollapse = useMemo(() => localStorage.getItem('fullPanelCollapse') === 'true', []);

  /**
   * Memoize artifacts JSX to prevent recreating it on every render
   * This is critical for performance - prevents entire artifact tree from re-rendering
   */
  const artifactsElement = useMemo(() => {
    if (artifactsVisibility === true && Object.keys(artifacts ?? {}).length > 0) {
      return (
        <ArtifactsProvider>
          <EditorProvider>
            <Artifacts />
          </EditorProvider>
        </ArtifactsProvider>
      );
    }
    return null;
  }, [artifactsVisibility, artifacts]);

  return (
    <>
      <style>
        {`
        .premium-chat-theme {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          transition: background 250ms ease, color 250ms ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translate3d(0,16px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes messageAppear { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.35s ease both; }
        .animate-fadeInUp { animation: fadeInUp 0.35s ease both; }
        .animate-slideUp { animation: slideUp 0.45s ease both; }
        .animate-scaleIn { animation: scaleIn 0.35s ease both; }
        `}
      </style>
      <DragDropWrapper
        dir={(chatDirection ?? '').toString().toLowerCase() === 'rtl' ? 'rtl' : 'ltr'}
        className="premium-chat-theme relative flex h-full w-full items-stretch justify-end overflow-hidden bg-[linear-gradient(180deg,#F8FAFF_0%,#EFF2F7_100%)] text-[#2C2F36] transition-colors dark:bg-gradient-to-br dark:from-[#0d1221] dark:via-[#0e1424] dark:to-[#101729] dark:text-gray-100"
      >
        <SidePanelProvider>
          <div className="relative z-10 flex h-full w-full justify-end px-0 pb-0 pt-0">
            <SidePanelGroup
              defaultLayout={defaultLayout}
              fullPanelCollapse={fullCollapse}
              defaultCollapsed={defaultCollapsed}
              artifacts={artifactsElement}
            >
              <main
                dir={(chatDirection ?? '').toString().toLowerCase() === 'rtl' ? 'rtl' : 'ltr'}
                className="flex h-full w-full flex-col overflow-hidden text-text-primary transition-all duration-300"
                role="main"
              >
                {children}
              </main>
            </SidePanelGroup>
          </div>
        </SidePanelProvider>
      </DragDropWrapper>
    </>
  );
}
