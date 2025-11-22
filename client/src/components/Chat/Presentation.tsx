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
      dir="rtl"
      className="relative mx-auto flex h-full w-full max-w-[1860px] items-stretch justify-end overflow-hidden rounded-[34px] border border-white/40 bg-gradient-to-br from-sky-50/70 via-white/70 to-purple-100/65 p-4 shadow-[0_30px_110px_-55px_rgba(59,130,246,0.6)] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-[2px] hover:shadow-[0_34px_130px_-50px_rgba(99,102,241,0.68)] dark:border-white/10 dark:from-slate-950/75 dark:via-slate-950/70 dark:to-indigo-950/70 dark:shadow-black/50 sm:p-7"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-sky-50/55 to-indigo-100/65 dark:from-slate-900/80 dark:via-slate-950/70 dark:to-indigo-950/70" />
        <div className="absolute right-[-18%] top-[-8%] h-[320px] w-[320px] rounded-full bg-sky-500/18 blur-[120px] dark:bg-indigo-800/28" />
        <div className="absolute left-[-12%] bottom-[-16%] h-[320px] w-[320px] rounded-full bg-purple-500/12 blur-[140px] dark:bg-purple-900/28" />
        <div className="absolute left-[18%] top-[6%] h-[160px] w-[160px] rounded-full bg-white/35 blur-[90px] dark:bg-white/10" />
      </div>
      <SidePanelProvider>
        <div className="relative z-10 flex h-full w-full max-w-[1640px] justify-end">
          <SidePanelGroup
            defaultLayout={defaultLayout}
            fullPanelCollapse={fullCollapse}
            defaultCollapsed={defaultCollapsed}
            artifacts={artifactsElement}
          >
            <main
              dir="rtl"
              style={{ fontFamily: 'Vazir, system-ui, -apple-system, sans-serif' }}
              className="flex h-full flex-col overflow-y-auto rounded-[30px] border border-white/50 bg-white/88 px-5 py-7 text-text-primary shadow-[0_24px_90px_-55px_rgba(59,130,246,0.75)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_32px_110px_-62px_rgba(99,102,241,0.8)] dark:border-white/10 dark:bg-slate-900/85 dark:text-white dark:shadow-[0_20px_55px_rgba(0,0,0,0.45)] sm:px-8 sm:py-9"
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
