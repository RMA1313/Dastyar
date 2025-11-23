import { useEffect } from 'react';
import TagManager from 'react-gtm-module';
import { useGetStartupConfig } from '~/data-provider';

/**
 * Footer is intentionally invisible to satisfy the no-footer requirement,
 * but it still boots analytics side-effects when configured.
 */
export default function Footer() {
  const { data: config } = useGetStartupConfig();

  useEffect(() => {
    if (config?.analyticsGtmId != null && typeof window.google_tag_manager === 'undefined') {
      const tagManagerArgs = {
        gtmId: config.analyticsGtmId,
      };
      TagManager.initialize(tagManagerArgs);
    }
  }, [config?.analyticsGtmId]);

  return null;
}
