# express-response
A builder pattern based standard response builder (easy integration with remote-ui)

> Follows standard error format & fully customizable, most scenarios implemented by default, many of them are inspired by django rest framework

## Installation

install with yarn

`yarn add @bridged.io/express-response`


install with npm

`npm install @bridged.io/express-response`


## How to use
```ts
import { response, errors } from "@bridged.io/express-response"

router.get(`/users/:id`, async (req, res) => {
    // ...
    // response.single<User>(users)
    throw errors.notfound()
    // ...
})

router.get(`/users`, async (req, res) => {
    // ...
    const users = await userDao.fetchAll();
    response.many<User>(users)
    // ...
})

router.post(`/users`, async (req, res) => {
    const { username, phone, passcode } = req.body 
    // ...
    try {
        // ...
        const normalizedPhoneNumber = normalize(phone)
        // ...
    }catch (e) {
        response.error(req, res).withError(e).send()
    }
    // ...
})
```

or.. use it globally with your own errorHandlerMiddleware
```ts
import { response } from "@bridged.io/express-response"

const app = // .... your express app

function errorHandler (err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }
  response.error<any>(req, res).withError(err).send()
}

app.use(errorHandler)
```

## More configurations
-- enable logging for all errors
-- handle empty as no 204 content
-- handle empty as not 404 found
-- debug mode (returns helpful information & stack trace inside error response)
