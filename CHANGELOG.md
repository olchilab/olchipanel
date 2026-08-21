# Changelog

## [0.8.2](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.8.1...olchipanel-v0.8.2) (2026-08-21)


### Bug Fixes

* **ui:** fit plan board without clipping ([b1ed03a](https://github.com/olchilab/olchipanel/commit/b1ed03a77e70656851af0292c32805b3cd2a8ad1))
* **ui:** fit plan board without clipping ([3a4f0ea](https://github.com/olchilab/olchipanel/commit/3a4f0ea04c8e58207d0d91e166826d5bbfba8684))

## [0.8.1](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.8.0...olchipanel-v0.8.1) (2026-08-20)


### Bug Fixes

* **ui:** sharpen Windows taskbar icon ([39818a8](https://github.com/olchilab/olchipanel/commit/39818a88d133c94b3b3cba148eabc8c7fe06a88d))
* **ui:** sharpen Windows taskbar icon ([fba8096](https://github.com/olchilab/olchipanel/commit/fba8096de095c9f04012dfdd168835dd3db52fd0))

## [0.8.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.7.0...olchipanel-v0.8.0) (2026-08-20)


### Features

* **ui:** add responsive shell and Olchi app icons ([d2fd734](https://github.com/olchilab/olchipanel/commit/d2fd7346b769b4a1a1084c5897817d0e1d0d4cb5))
* **ui:** responsive shell and Olchi app icons ([3c18d29](https://github.com/olchilab/olchipanel/commit/3c18d298ba39d663559426b42a3c9ee2aeb95f55))

## [0.7.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.6.2...olchipanel-v0.7.0) (2026-07-29)


### Features

* brand tokens, session rename, plan tab, empty-board onboarding ([015c37b](https://github.com/olchilab/olchipanel/commit/015c37b7eab06e492052187d25d1cc9a41b31780))
* Linear/Jira-style plan feature ([f2231e3](https://github.com/olchilab/olchipanel/commit/f2231e312fc21d39d660b14abd670e8298a8cfc9))


### Bug Fixes

* single-port single-instance viewer + auto-archive stale sessions ([44e8685](https://github.com/olchilab/olchipanel/commit/44e86851d8d0d4561e56c37a5f8b129a37426f33))

## [0.6.2](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.6.1...olchipanel-v0.6.2) (2026-07-28)


### Bug Fixes

* auto-open opens one window per board (was one per connected agent) ([9aa92cc](https://github.com/olchilab/olchipanel/commit/9aa92ccb3ecebd6399af0c0bd2a418c90bc68339))

## [0.6.1](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.6.0...olchipanel-v0.6.1) (2026-07-28)


### Bug Fixes

* hide idle-fold line when sidebar collapsed; dedicated Chrome app profile ([5600d87](https://github.com/olchilab/olchipanel/commit/5600d87c9aae5b10b751a58e0ced8038c97675bd))

## [0.6.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.5.0...olchipanel-v0.6.0) (2026-07-28)


### Features

* per-panel memo tab + fold idle panels + app-window without address bar + ChatGPT chat/work verdict ([dae136a](https://github.com/olchilab/olchipanel/commit/dae136af032f483ca2b757169540a16ae85eb2ee))

## [0.5.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.4.0...olchipanel-v0.5.0) (2026-07-28)


### Features

* memo drawer + olchipanel stop + honest quitting guidance ([c5a42e2](https://github.com/olchilab/olchipanel/commit/c5a42e238dffb4689c000be8955b9ff53f968976))


### Bug Fixes

* friend-pilot polish — batch newlines, READY line, path hint, ENOTCACHED note ([0b47ba8](https://github.com/olchilab/olchipanel/commit/0b47ba8c738f96675c3a3b660feba1dba2be3ea5))

## [0.4.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.3.0...olchipanel-v0.4.0) (2026-07-27)


### Features

* laptop-pilot batch — [@latest](https://github.com/latest) auto-update, update chip, star ask, now semantics, batch add_step, Windows field notes ([2c5b0c4](https://github.com/olchilab/olchipanel/commit/2c5b0c4274adf237d322b7c9d84ea9b5fe6d2db4))


### Performance Improvements

* background devices armed only in the bind-winning process ([ccf8ad6](https://github.com/olchilab/olchipanel/commit/ccf8ad6ab91cb3e4b2ded85071a7b4191ddaec37))

## [0.3.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.2.0...olchipanel-v0.3.0) (2026-07-27)


### Features

* archive button in the main view ([9dcc7c2](https://github.com/olchilab/olchipanel/commit/9dcc7c21cb5b439f5e2815c97b6629f8ab0b54f2))
* stale-live state — alive but silent 30m+ gets marked and becomes archivable ([7004780](https://github.com/olchilab/olchipanel/commit/7004780d7ff6daff37335c789d29fb7474d2fa1c))


### Bug Fixes

* adopting open no longer lingers as a zombie process + ping timeout 900ms-&gt;2s ([624bb5f](https://github.com/olchilab/olchipanel/commit/624bb5f20ec3350f0bf6dd765e5071286d86d719))
* bootstrap one-liner wraps; session name follows the conversation title via name_session contract ([d10c10a](https://github.com/olchilab/olchipanel/commit/d10c10a5689c52edbe1518c30d79e83b7229d9a8))

## [0.2.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.1.1...olchipanel-v0.2.0) (2026-07-25)


### Features

* titlebar melts into the app — theme-color meta + installable PWA manifest ([90cd538](https://github.com/olchilab/olchipanel/commit/90cd538f287e7d30210256626ddf87f625efaa62))
* uninitialized-board state + optional stable workspace key (issue [#3](https://github.com/olchilab/olchipanel/issues/3), items 2 & 3) ([00cc1a8](https://github.com/olchilab/olchipanel/commit/00cc1a8705c7f502de9364513ba1f04f0795ea1e))


### Bug Fixes

* viewer discovery self-heals + no duplicate viewers + true server version (issue [#3](https://github.com/olchilab/olchipanel/issues/3), items 1 & 4) ([534fd4a](https://github.com/olchilab/olchipanel/commit/534fd4a531deca557f42031412c7c9e5f53380d7))

## [0.1.1](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.1.0...olchipanel-v0.1.1) (2026-07-25)


### Bug Fixes

* npm pkg fix — bin path without ./ (npm was stripping the bin entry on publish) ([4ef7777](https://github.com/olchilab/olchipanel/commit/4ef7777cda515e1b8c8691d01a2296e94e2c5e74))
