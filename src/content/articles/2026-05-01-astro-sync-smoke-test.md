---
title: Astro sync smoke test article verifying engine to site repo write
slug: astro-sync-smoke-test
beat: business
publishedAt: '2026-05-01T12:26:42.179Z'
author:
  name: Arsh Lakhani
  slug: arsh-lakhani
sources:
  - id: smoke
    name: Smoke Test
    url: https://businessleaders.in/about/
    language: en
image:
  path: /images/articles/astro-sync-smoke-test.jpg
  alt: Smoke test
  photographer: Engine
  source: fallback
metaDescription: A smoke-test article verifying the astro-sync library writes valid frontmatter and copies the image into the site repo.
tags:
  - smoke-test
  - engine
  - astro-sync
wordCount: 120
auditScore: 7
runId: smoke-2026-05-01
---

This is a smoke-test of the astro-sync library. The actual content here is a single paragraph describing what the test does. The publish path expects a real markdown body and a real image at the engine's images directory. The astro-sync function then writes the frontmatter file into the site repo's content collection and copies the image to the public images directory.

A second paragraph confirms the body is multi-paragraph capable. The site repo's content schema validation should accept the resulting frontmatter so long as every required field is present and valid.
