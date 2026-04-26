import type { ReactElement } from 'react';

import { Redirect } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * Site root redirect to the docs landing page
 *
 * The docs site is "all docs" — there's no marketing landing. Hitting
 * the root immediately bounces to the Getting Started page (current
 * version). Version dropdown in the navbar handles version switching.
 */
export default function Home(): ReactElement {
  const { siteConfig } = useDocusaurusContext();

  return <Redirect to={`${siteConfig.baseUrl}docs/getting-started`} />;
}
