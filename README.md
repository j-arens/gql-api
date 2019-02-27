work-in-progress
========

This is an ecommerce GraphQL API modeled around selling mostly distributed software, specifically WordPress plugins and themes.

## Requirements

* node
* typescript
* docker
* docker-compose

### Development

Make sure you have Typescript installed globally.

```sh
$ yarn global add typescript
```

Install dependencies.

```sh
$ yarn
```

Start up mysql and redis docker containers.

```sh
$ yarn docker:up
```

Start a development instance of the app with GraphQL playground.

```sh
$ yarn dev
```

## Linting

```sh
$ yarn lint
```

Run `$ yarn lint:fix` to let the linter try to automatically fix issues.

## Unit Testing

Tests are run with real queries against a real mysql instance, so make sure you've started the mysql docker container.

```sh
$ yarn test
```
