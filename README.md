# Evoku

[![Continuous Integration](https://github.com/Teinc3/Evoku/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/Teinc3/Evoku/actions/workflows/ci.yml)
[![Continuous Deployment](https://github.com/Teinc3/Evoku/actions/workflows/cd.yml/badge.svg?branch=master)](https://github.com/Teinc3/Evoku/actions/workflows/cd.yml)
[![codecov](https://codecov.io/github/Teinc3/Evoku/branch/master/graph/badge.svg?token=U83CE972IQ)](https://codecov.io/github/Teinc3/Evoku)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-demo.evoku.io-blue?style=flat&logo=github&logoColor=white)](https://demo.evoku.io)


## Introduction
This repository contains the source code, assets, tests and documentation for the game Evoku.

> [!NOTE]
> This repository is temporarily public for recruitment and technical evaluation purposes only.
> - Review and run the code for hiring or assessment activities are allowed.
> - Redistribution, modification, commercial use, or sharing with third parties is not permitted.
> 
> See the [LICENSE](#license) section below for more information, including my contact details.
>
> - For Recruiters or potential employers: feel free to review and evaluate the code.
> - For Designers/artists who want to contribute assets: please contact me and we will arrange privately.
> - For license, permission requests or other inquiries, please contact me.


## Live Demo
Try the latest build deployed automatically from master at [https://demo.evoku.io](https://demo.evoku.io)!


## Information and Documentation
- Documentation of the source code is organised into the [`docs`](/docs/) directory.
See the [Source Documentation](/docs/README.md) for more information.
- For other non-technical information, refer to the [wiki page](https://github.com/Teinc3/Evoku/wiki).


## Planned Milestones:
- MVP (Minimum Viable Product) - December 2025


## Coverage Chart
<img src="https://codecov.io/github/Teinc3/Evoku/graphs/icicle.svg?token=U83CE972IQ"></img>


## Development
To install dependencies, run:
```bash
npm install
```

To launch both the game client and the game server concurrently, run:
```bash
npm run dev
```

The Typescript Compiler is set to noEmit, but you can still do a static type check by running:
```bash
npm run comp
```

The project adheres strictly to certain coding standards and linting rules. To check for errors, run:
```bash
npm run lint
```

To run tests for both the client and server, run:
```bash
npm run test
```

There are separate commands to launch the client and server individually:
```bash
npm run dev:client
npm run dev:server
```

Note that these separate commands also apply to other npm commands, such as start and test.


## License
All rights reserved © Teinc3 2024-2025.

See [LICENSE](/LICENSE) for more information.
For any inquiries, please contact me on Discord (@teinc3) or email help@evoku.io.
