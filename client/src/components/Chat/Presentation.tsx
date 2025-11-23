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
    <DragDropWrapper
      dir={(chatDirection ?? '').toString().toLowerCase() === 'rtl' ? 'rtl' : 'ltr'}
      className="relative flex h-full w-full items-stretch justify-end overflow-hidden bg-gradient-to-br from-[#eef4ff] via-[#f6f9ff] to-[#eef6ff] text-text-primary transition-colors dark:bg-gradient-to-br dark:from-[#0b1324] dark:via-[#0f172a] dark:to-[#0b1120] dark:text-gray-100"
    >
      <SidePanelProvider>
        <div className="relative z-10 flex h-full w-full justify-end">
          <SidePanelGroup
            defaultLayout={defaultLayout}
            fullPanelCollapse={fullCollapse}
            defaultCollapsed={defaultCollapsed}
            artifacts={artifactsElement}
          >
            <main
              dir={(chatDirection ?? '').toString().toLowerCase() === 'rtl' ? 'rtl' : 'ltr'}
              className="flex h-full w-full flex-col overflow-hidden bg-transparent text-text-primary"
              role="main"
            >
              {children}
            </main>
          </SidePanelGroup>
        </div>
      </SidePanelProvider>
    </DragDropWrapper>
  );
}
