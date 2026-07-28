## v4.3.1 — 2026-07-28

- ✨ [Gitmoji u položek a odkazy na commity v seznamu změn](https://github.com/bosancz/interni-sekce/commit/8b5dfaebc800461a73d3e50649a6df8049f06181)
- ✨ [Zobrazení seznamu změn po kliknutí na verzi v menu](https://github.com/bosancz/interni-sekce/commit/527964f0cef0b84c03c4526c3021b139c3771dbe)
- 👷 [Generování changelogu i při vydání na NEXT](https://github.com/bosancz/interni-sekce/commit/2d2880794cca5295a8553812efc959efc157481c)

## v4.3.0 — 2026-07-28

- ✨ [Restrict permanent deletion to admins on all entities](https://github.com/bosancz/interni-sekce/commit/7caaba8226a39fd359dfc37b0d1d3e79aab03a25)
- ✨ [Remove UsersList permission from vedouci](https://github.com/bosancz/interni-sekce/commit/fa9a584c33fe3b37c0699c96754830892ef8694c)
- ✨ [Make tag chips keyboard-accessible](https://github.com/bosancz/interni-sekce/commit/92b0821b8c0613fb4b9f6c4686b982d6a1d77490)
- ✨ [Reintroduce photo tags editing and viewing](https://github.com/bosancz/interni-sekce/commit/fdf523292197760dfc0c16c9b77c5ed763db2c77) (#292)
- ✨ [Gate admin/program routes on API root \_links permissions](https://github.com/bosancz/interni-sekce/commit/9fcebc4630cb03aa695eb9901ddceb8fcd2ccf9a) (#219)
- ✨ [Load CPV events from raft.cz calendar](https://github.com/bosancz/interni-sekce/commit/dc780ce04da0170a51057ff02489a7b5998e28d5) (#139)
- ✨ [Nabízet jen instruktory a vedoucí při přidávání vedoucího akce](https://github.com/bosancz/interni-sekce/commit/7d373739075b0fcc437475a6b688fcb6ce982a20) (#284)
- 🐛 [Apply confirmed filter after the modal's back-close settles](https://github.com/bosancz/interni-sekce/commit/32a48c51c5c6caaaaf610764bd888a29eeef976d)
- 🐛 [Apply the filter with replace, don't stack history entries](https://github.com/bosancz/interni-sekce/commit/185d23d05d8c26d504cef3f176880f64e13bd150)
- 🐛 [Fix avatar initials for nicknames starting with a diacritic](https://github.com/bosancz/interni-sekce/commit/242cfe266f41eaf1cad0ebdc58c4cf97c542fb60)
- 🐛 [Fix unused imports](https://github.com/bosancz/interni-sekce/commit/5b02c28d1dded57ded24c3ac2adbed863761b765)
- 🐛 [Stage every control in the mobile filter modal](https://github.com/bosancz/interni-sekce/commit/c3a2840844577f29db47c0483ca1b4173c6c37e6)
- 🐛 [Fix duplicated CPV events and drop inapplicable Event links](https://github.com/bosancz/interni-sekce/commit/a8e31a1ff4796056bc246977c9daee11a5cd25ce)
- 🐛 [Truly stage mobile filters instead of reverting the URL](https://github.com/bosancz/interni-sekce/commit/e99eb461371b5c5eb18d0a65c38e0219f93e8ae1)
- 🐛 [Stage mobile filters and keep them on confirm](https://github.com/bosancz/interni-sekce/commit/48a30ccc4c1d8eea3f099299ed1a15590c162582)
- 🎨 [Keep inputs and outputs adjacent in album-gallery](https://github.com/bosancz/interni-sekce/commit/4df143b46d91d0515c2cdbd7a99a928896a1bf9c)
- ♻️ [Own the back-close settle in ModalService](https://github.com/bosancz/interni-sekce/commit/d9843f6847685603776be57e45e4fb0c45674cdd)
- ♻️ [Move staging into a wrapper filter model](https://github.com/bosancz/interni-sekce/commit/e04768248e7d0b26bfff013caf0abbf80d77a950)
- ♻️ [Polish photo tags editor after review](https://github.com/bosancz/interni-sekce/commit/9fc508fd62bcf9364c83608692cde8985acb6b3f)
- 📝 [Start your own dev server when none is running](https://github.com/bosancz/interni-sekce/commit/46bd2ec8a35140b783dd34eaf2bbe2ce8d816a29)

## v4.2.2 — 2026-07-26

- 🐛 [Load all group members in group members tab](https://github.com/bosancz/interni-sekce/commit/c9ee7be116407f0602cdaef34718ce588f1d1c98)
- 🔧 [Remove version from package.json](https://github.com/bosancz/interni-sekce/commit/582bb784831fad7be033ff7dce765814bea05807)

## v4.2.1 — 2026-07-26

- ✨ [Add heading buttons, report template, visible textarea](https://github.com/bosancz/interni-sekce/commit/bb9c2cc1daf0293805e9e4c96c49c2aa9fef0e1e)
- 🐛 [Paint editor borders with defined theme tokens](https://github.com/bosancz/interni-sekce/commit/9cefa053d54d83dad9801ec1576b84bd3a388e7b)
- 🐛 [Outline textarea via wrapper so border always shows](https://github.com/bosancz/interni-sekce/commit/81e6143b4d61e1e2334fdca53be2dcefe8d1a1a7)
- 🐛 [Use fill="outline" for a visible textarea border](https://github.com/bosancz/interni-sekce/commit/d36a6dc8b5b4dbac8fc73519d870743df2fd4863)
- 👷 [Only create version tag when it does not already exist](https://github.com/bosancz/interni-sekce/commit/d1d359032f8d02b15393b23a543fedb7a9c47cc7)

## v4.2.0 — 2026-07-26

- ✨ [Also file in-app bug reports as GitHub issues](https://github.com/bosancz/interni-sekce/commit/01fb23d8eb28c2dc314b21154ba9d680097c841d)

## v4.1.5 — 2026-07-26

- 🐛 [Hide the hover preview when an event is opened](https://github.com/bosancz/interni-sekce/commit/b1d49a435cc612d3d37ad7d2b821d67427cac2a8) (#278)
- 🐛 [Fix too long bar solved by shorter names of pages](https://github.com/bosancz/interni-sekce/commit/2cc6526fa98dbc6d96dd28dfe3f567acea06d5dd)
- 🔧 [Print logging info on cli](https://github.com/bosancz/interni-sekce/commit/9d012eddfbf70162f6a4455815c837969a31efe6)
- 🔧 [Remove obsolete mongo db from devcontainer](https://github.com/bosancz/interni-sekce/commit/f67831fcb4232e600069192d5f3899cf531d4ae8)

## v4.1.4 — 2026-07-26

_Interní vylepšení a údržba._

## v4.1.3 — 2026-07-26

_Interní vylepšení a údržba._

## v4.1.2 — 2026-07-26

- 🐛 [Correct transposed photo aspect ratios in the gallery](https://github.com/bosancz/interni-sekce/commit/f012e0d122daf6610477f3fde006676ca2599e77)

## v4.1.1 — 2026-07-25

- 🐛 [Fix PWA icon white background on desktop installs](https://github.com/bosancz/interni-sekce/commit/dcac4587efa13ba22ea743e10241cad1b470e602)

## v4.1.0 — 2026-07-25

- ✨ [Full-text search via tsvector search_vector columns](https://github.com/bosancz/interni-sekce/commit/df74e3c75e299a661ac78d5a6e3c6c4ffe011eb1)

## v4.0.7 — 2026-07-25

- ✨ [Update bg color in manifest](https://github.com/bosancz/interni-sekce/commit/8948dc6653a0e189212f94eb1c1b8d8aaac88104)
- 👷 [Update actions versions](https://github.com/bosancz/interni-sekce/commit/7c237871454f184039d973f5dce803d3bfb98492)
- 👷 [Rename image-name input](https://github.com/bosancz/interni-sekce/commit/7868ff8d64faef2564f53245bfd87f643b8743be)

## v4.0.6 — 2026-07-25

- 📝 [Add jirik22, Cita22 and MichalPham as contributors](https://github.com/bosancz/interni-sekce/commit/d664ef46f0775ed4b45930a2ecd664acfcf57816)

## v4.0.5 — 2026-07-25

- 🐛 [Update naming](https://github.com/bosancz/interni-sekce/commit/722ef9b6fa25f4998e3c4c78e4254aef17d2f54d)

## v4.0.4 — 2026-07-24

- 🐛 [Make install banner legible and on-brand in dark mode](https://github.com/bosancz/interni-sekce/commit/7b29d393a3d29b36f435b04a9d669f58d6c0fd78)

## v4.0.3 — 2026-07-24

- 🐛 [Remove hardcoded NEXT beta label from page title](https://github.com/bosancz/interni-sekce/commit/5dfdae11a350160bb71da033de3892c9701a0951)

## v4.0.2 — 2026-07-24

- 🐛 [Resolve legacy registration PDFs for public program endpoint](https://github.com/bosancz/interni-sekce/commit/b4585daee713eb29e09637d2328649dda5f58fa9)

## v4.0.1 — 2026-07-24

- ✨ [Add automatic native PWA install prompt and refresh app icons](https://github.com/bosancz/interni-sekce/commit/1b3208e7e0273475b7ee2c401a8f1874bf69f443)
- 🐛 [Serve legacy event registration PDFs by Mongo ObjectId](https://github.com/bosancz/interni-sekce/commit/7b51abebbc27e08ba5940ed60890618a24521ee1)
- 🐛 [Validate numeric route params with ParseIntPipe](https://github.com/bosancz/interni-sekce/commit/9519f0be60b365bc54360b8183d696382c238d59)
- 👷 [Remove autorelease to next form next branch, remove next branch](https://github.com/bosancz/interni-sekce/commit/97659fccd0f9d662b414cc8c3217913ba2d83024)
- 👷 [Remove test deployment, remove autorelease from next](https://github.com/bosancz/interni-sekce/commit/ad15e29e87cb8c965c4f3e33efafb6daac362765)
- 🔧 [Update types](https://github.com/bosancz/interni-sekce/commit/cd5bd002b6fb8a78953964f25459980e7f311b85)

## v4.0.0 — 2026-07-24

- ✨ **Kompletní přepis aplikace do NestJS a PostgreSQL a nové vizuální identity**

---

## v3.3.1 — 2025-11-26

- 🐛 [Test api urls](https://github.com/bosancz/interni-sekce/commit/837d01aa3d48661647d7a325f43928d977e3bc40) (#48)
- 🐛 [Correct API path in frontend environment file](https://github.com/bosancz/interni-sekce/commit/e72c0fc84524b7c168377491f51731f7a74317db)

## v3.3.0 — 2024-01-22

- ✨ [Add members export to xlsx](https://github.com/bosancz/interni-sekce/commit/f433940d0bdd22206fc99faa169582e709429397) (#37)

## v3.2.9 — 2023-04-15

- ✨ [Add expense types](https://github.com/bosancz/interni-sekce/commit/7c546aa702f3cb97bf4c91739fca0d95536b8f1f)

## v3.2.8 — 2023-03-31

- ✨ [Improve layout of member view page](https://github.com/bosancz/interni-sekce/commit/f1c2a3cd581925a63cc7a3deade8fc55bb0b8417) (#25)
- ✨ [Add notification mail for event submitted](https://github.com/bosancz/interni-sekce/commit/1b018337423b807addf86fa5aa4c884e781de298) (#23)

## v3.2.7 — 2022-12-15

- ✨ [Search memebers from home page](https://github.com/bosancz/interni-sekce/commit/c2fdd6f3f095860773619d47dd7fff99b9ff7b58)
- ✨ [Logo kudyznudy kvuli linku na haloween](https://github.com/bosancz/interni-sekce/commit/fa0786daf106cf94fc6f75ed42485484537bd163)
- ✨ [Remove ukraine banner](https://github.com/bosancz/interni-sekce/commit/df5142ea34216f407b6a329ed99981c4354380ba)
- ✨ [Devcontainer](https://github.com/bosancz/interni-sekce/commit/9a827ca6cdbad3130957af84e54c39513519e62d)
- ✨ [Automerge patch updates by dependabot](https://github.com/bosancz/interni-sekce/commit/2dcb9c6ce8cea0f80dadc9bac9ff02bd1bd29111)
- ✨ [Add commitlint](https://github.com/bosancz/interni-sekce/commit/fde9fc7d986224c5f17aa0e000cea611a2306d2c)
- 🐛 [Show leaders in attedee list](https://github.com/bosancz/interni-sekce/commit/96ee8e9dc556762c5b534b72b255b85c2fc944a2)
- 🐛 [Sorting of expenses in frontend and excel](https://github.com/bosancz/interni-sekce/commit/c1ca63569e820b3358b2d93e09a9210ff7147dbe)
- 🐛 [Expense numbers from 1](https://github.com/bosancz/interni-sekce/commit/a06f71ba3e3c030060180a296fb63c9648e32e9c)
- 🐛 [Fix typescript version in lock file](https://github.com/bosancz/interni-sekce/commit/711fc4504d233450334285ba617eb7d4528556a8)

## v3.2.3 — 2022-03-30

_Bez uživatelských změn._

## v3.2.2 — 2022-03-30

- ✨ [Add notice with link to stojimezaukrajinou.cz](https://github.com/bosancz/interni-sekce/commit/90ad4c6a15a6e6be4cb0631cc914acf1c5c58210)
- ✨ [Enable copying of rows, search always visible](https://github.com/bosancz/interni-sekce/commit/5e66938f781f7886a99fb54094982510ed170218)
- ✨ [Minor improvements for album photos editing](https://github.com/bosancz/interni-sekce/commit/9be669aee8e5ca722854c14e7bb99ece8a105526)
- ✨ [Add uptime badge](https://github.com/bosancz/interni-sekce/commit/1a349d5c1b042467e2a17e5f656f3fb7697604f2)
- ✨ [Add allcontributors to READM](https://github.com/bosancz/interni-sekce/commit/d038365acc34e1e125b9d5e0aeed798a0621926a)
- ✨ [Remove pf2022](https://github.com/bosancz/interni-sekce/commit/a1203bb25aa3f5c1023e82b9dfa67deeb0c93f06)
- ✨ [Folder rename](https://github.com/bosancz/interni-sekce/commit/ff44db6532a7eb242b40f95bac973a8b893852db)
- ✨ [Nicer attendees list](https://github.com/bosancz/interni-sekce/commit/2d712482aa98d7b74fd07fb76b377ac1a0743238)
- ✨ [Add pf 2022 popup](https://github.com/bosancz/interni-sekce/commit/627f12b96f84fc55b00e45a90476147a7562f7bb)
- ✨ [Partially revert home menu until better mobile laytou](https://github.com/bosancz/interni-sekce/commit/c087147b83aebb9838660929a62f416796e0c129)
- ✨ [Show menu on start on mobile](https://github.com/bosancz/interni-sekce/commit/c5695ac7499f4d194587ed56624805be7e7327f4)
- 🐛 [Tabs navigation v3.2.2](https://github.com/bosancz/interni-sekce/commit/35ddcf1e07ce1265479b02c1acc1f09cf1ca005f)
- 🐛 [Prevent arrows to move photos and esc to close when editing photo caption](https://github.com/bosancz/interni-sekce/commit/1fb051756ac03387b4b38a71b9ae5e0eceab3373)
- 🐛 [Event images and group colors in program](https://github.com/bosancz/interni-sekce/commit/dafa0daff76d23643aa9dd10d1ee50dc104a1cdd)
- 🐛 [Bad config path for JWT secret](https://github.com/bosancz/interni-sekce/commit/7fa9f94e63d37218ed87ea9e3820268c134a07a9)
