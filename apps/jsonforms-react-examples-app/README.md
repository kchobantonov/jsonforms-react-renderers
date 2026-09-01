# JSON Forms - More Forms. Less Code

_Complex forms in the blink of an eye_

JSON Forms eliminates the tedious task of writing fully-featured forms by hand by leveraging the capabilities of JSON, JSON Schema and Javascript.

## React Examples App

This project is the selector shell for all JSON Forms React renderer demos. It
aggregates the independently built Ant Design, Material UI, PrimeReact, and
Shadcn applications and makes them reachable from one page.

From the repository root, build and start the selector with:

```sh
pnpm run examples-app:dev
```

The aggregate production output can be created with:

```sh
pnpm run examples-app:build
```

The build is written to `dist`. Each renderer remains its own application and
is copied into a separate subdirectory by
[prepare-examples-app.js](./prepare-examples-app.js).
