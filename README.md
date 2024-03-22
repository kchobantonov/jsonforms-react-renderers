### First time setup

- Install [node.js](https://nodejs.org/) (only Node v18.19+ < 19 is currently supported)
- Install pnpm: <https://pnpm.io/installation> (use pnpm 8.6.2+)
- Clone this repository
- Install dependencies: `pnpm i --frozen-lockfile`

### Build & Testing

- Build (all packages): `pnpm run build`
- Test (all packages): `pnpm run test`
- Clean (delete `dist` folder of all packages): `pnpm run clean`
- Run React Ant Design examples: `cd packages/antd-renderers && pnpm run dev`
