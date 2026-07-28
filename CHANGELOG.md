# Changelog

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
