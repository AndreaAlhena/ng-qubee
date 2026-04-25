import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'ng-qubee',
  tagline: 'Your next Angular Query Builder',
  favicon: 'img/favicon.ico',

  future: {
    v4: true
  },

  // Production URL — custom subdomain on andreatantimonaco.me
  url: 'https://ng-qubee.andreatantimonaco.me',
  baseUrl: '/',

  // GitHub Pages deployment config
  organizationName: 'AndreaAlhena',
  projectName: 'ng-qubee',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        // Source entry point — re-uses the library's existing public-api.ts
        // so the API reference covers exactly what consumers can import
        entryPoints: ['../src/public-api.ts'],
        // Dedicated tsconfig that strips inlineSources/declarationMap (which
        // TypeDoc rejects when not paired with --sourceMap) and scopes
        // includes to the library src tree only — no docs-site files.
        tsconfig: './tsconfig.typedoc.json',
        // Output goes under the docs/ tree as docs/api/* so it shares the
        // Docusaurus sidebar machinery
        out: 'docs/api',
        readme: 'none',
        // Hide the auto-generated index page — the curated Getting Started
        // page already serves as the landing entry. The sidebar will pull
        // in everything under docs/api/.
        excludeInternal: true,
        sidebar: {
          autoConfiguration: true,
          pretty: true
        }
      }
    ]
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Edit-this-page link to develop branch (where work-in-progress lives)
          editUrl: 'https://github.com/AndreaAlhena/ng-qubee/edit/develop/docs-site/',
          // Versioning: before the first `docusaurus docs:version <v>` snapshot
          // runs, the "current" docs (i.e. develop) serve at /docs/. After
          // snapshotting, the named version takes over /docs/ and "current"
          // automatically moves to /docs/next/. The unreleased banner makes
          // the distinction visible.
          versions: {
            current: {
              label: 'next',
              banner: 'unreleased'
            }
          }
        },
        // Blog disabled — this is a library docs site, not a blog
        blog: false,
        theme: {
          customCss: './src/css/custom.css'
        }
      } satisfies Preset.Options
    ]
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true
    },
    navbar: {
      title: 'ng-qubee',
      logo: {
        alt: 'ng-qubee logo',
        src: 'img/logo.svg'
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs'
        },
        {
          type: 'docsVersionDropdown',
          position: 'right'
        },
        {
          href: 'https://www.npmjs.com/package/ng-qubee',
          label: 'npm',
          position: 'right'
        },
        {
          href: 'https://github.com/AndreaAlhena/ng-qubee',
          label: 'GitHub',
          position: 'right'
        }
      ]
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting Started', to: '/docs/getting-started' },
            { label: 'Drivers', to: '/docs/drivers/json-api' },
            { label: 'Query Builder API', to: '/docs/query-builder' },
            { label: 'Pagination', to: '/docs/pagination' }
          ]
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/AndreaAlhena/ng-qubee' },
            { label: 'npm', href: 'https://www.npmjs.com/package/ng-qubee' },
            { label: 'Changelog', href: 'https://github.com/AndreaAlhena/ng-qubee/blob/master/CHANGELOG.md' },
            { label: 'Issues', href: 'https://github.com/AndreaAlhena/ng-qubee/issues' }
          ]
        },
        {
          title: 'Author',
          items: [
            { label: 'Andrea Tantimonaco', href: 'https://andreatantimonaco.me' }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Andrea Tantimonaco — MIT licensed.`
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['typescript', 'bash', 'json']
    }
  } satisfies Preset.ThemeConfig
};

export default config;
