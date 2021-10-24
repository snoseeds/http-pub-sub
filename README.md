# http-pub-sub
Node.js (Typescript & NestJS) developed RESTFul APIs for topic http based pub sub

[![Maintainability](https://api.codeclimate.com/v1/badges/82582c51de0ef223d0ad/maintainability)](https://codeclimate.com/github/snoseeds/http-pub-sub/maintainability)
[![GitHub license](https://img.shields.io/github/license/snoseeds/Banka.svg)](https://github.com/snoseeds/http-pub-sub/blob/main/LICENSE)
[![Test Coverage](https://api.codeclimate.com/v1/badges/87cbfa83452cbb0dd136/test_coverage)](https://codeclimate.com/github/snoseeds/http-pub-sub/test_coverage)

## API Documentation
Built with Postman [link](https://documenter.getpostman.com/view/6777319/UV5agbhy)

# Technologies

* Node js
* Express
* Typescript
* NestJS
* PostgreSQL
* TypeORM
* Docker
* Shell Scripting
* Jest
* ESLint
* Code Climate & Coveralls

## Installation Requirements

* Node js
* Typescript
* npm
* Git
* Docker

### Installation code (Dev Mode)
run: 
```Bash
    $ git clone https://github.com/snoseeds/http-pub-sub
    $ cd http-pub-sub
    $ npm install
    $ npm run start:dev:clean / first run, subsequent runs can use `npm run start:dev` if the db wants to be preserved
    $ Explore it by using an API tool like Postman as seen from the documentation above
```

### Tests
```Bash
    $ npm test /Set MODE=TEST in src/config/config.service.ts before that, be sure to reset it to MODE=DEV or PROD need be
```


# Author

Nurudeen Soremekun

# License

Licensed for public use [MITLicence](https://opensource.org/licenses/MIT)
