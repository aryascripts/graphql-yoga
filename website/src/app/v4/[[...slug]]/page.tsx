/* eslint-disable react-hooks/rules-of-hooks -- false positive, useMDXComponents are not react hooks */
import { notFound } from 'next/navigation';
import { Callout, LegacyPackageCmd, NextPageProps, Tabs } from '@theguild/components';
import { defaultNextraOptions } from '@theguild/components/next.config';
import {
  compileMdx,
  convertToPageMap,
  evaluate,
  mergeMetaWithPageMap,
  normalizePageMap,
} from '@theguild/components/server';
import json from '../../../../remote-files/v4.json';
import { useMDXComponents } from '../../../mdx-components';
// @ts-expect-error -- add types for .mdx
import LegacyDocsBanner from '../../legacy-docs-banner.mdx';
// @ts-expect-error -- add types for .mdx
import CodegenCallout from '../../codegen-callout.mdx';

const { branch, docsPath, filePaths, repo, user } = json;

const { mdxPages, pageMap: _pageMap } = convertToPageMap({
  filePaths,
  basePath: 'v4',
});

// @ts-expect-error -- ignore
const v4Pages = _pageMap[0].children;

const yogaPageMap = mergeMetaWithPageMap(v4Pages);

export const pageMap = normalizePageMap(yogaPageMap);

const { wrapper: Wrapper, ...components } = useMDXComponents({
  PackageCmd: LegacyPackageCmd,
  CodegenCallout,
  Callout,
  Tab: Tabs.Tab,
  Tabs
});

export default async function Page(props: NextPageProps<'...slug'>) {
  const params = await props.params;
  const route = (params.slug || []).join('/');
  const filePath = mdxPages[route];

  if (!filePath) {
    notFound();
  }
  const response = await fetch(
    `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${docsPath}${filePath}`,
  );
  const data = await response.text();
  const rawJs = await compileMdx(data, { filePath, ...defaultNextraOptions });
  const { default: MDXContent, toc, metadata } = evaluate(rawJs, components);

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <LegacyDocsBanner yogaVersion={4} />
      <MDXContent />
    </Wrapper>
  );
}

export function generateStaticParams() {
  const params = Object.keys(mdxPages).map(route => ({
    slug: route.split('/'),
  }));
  return params;
}
