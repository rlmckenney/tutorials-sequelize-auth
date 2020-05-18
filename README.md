# API Authentication

As you develop your apps beyond the simple prototype stage, you will quickly have a requirement to restrict some content or features to registered users. For example in a blog application anyone should be able to read the articles, but only authorized users should be able to create new posts, and only the original author should be able to edit their posts.

There are several techniques for managing user registration and authentication:

- Session keys
- JavaScript Web Tokens (JWT)
- OAuth / social login

There are many libraries and SaaS services that can help manage this in your application. e.g.

- Passport.js
- Auth0
- Okta
- "role your own" solutions

To give you a better understanding of how it works, we'll build a simple local authentication system for your API routes that uses a Sequelize User model and JWTs.

## User Registration

The starter code in the `Unsolved` folder has a `/register` route that displays a simple (un-styled) user registration form. To more easily demonstrate the application logic it just uses the built-in browser form submission functionality. The results returned from the `/api/users` route will be displayed in the browser on completion.

You would normally want to do this with an AJAX fetch call and then either prompt the user to correct validation errors, or redirect to another page of the application. We will look at this in a later module.

### Protect the password

One of the most important security measures EVERY application needs to implement is protecting the users' passwords. This has two parts: encryption and redaction.

#### Encryption

You should use a standard [one-way-hash](https://en.wikipedia.org/wiki/Cryptographic_hash_function) encryption library like _bcrypt_ or _argon2_ to ensure that passwords are never "readable" in your application.

- Add the [argon2 NPM package](https://www.npmjs.com/package/argon2) to your project dependencies. See the [argon2 wiki](https://github.com/ranisalt/node-argon2/wiki/Options) for examples how how to use it.

- Use Sequelize [model lifecycle hooks](https://sequelize.org/v5/manual/hooks.html) to automatically encrypt the a user's password before it is created.

#### Redaction

Some models have properties holding sensitive data, like passwords, that should not be returned to the client. Rather than manually stripping these out (and possibly forgetting to do so) in every route handler that touches that model, you can change the default behaviour on the model itself.

The sequelize documentation is not very clear on this topic, even if you know what to look for. So, here is what you need to know.

##### Override the `.toJson()` method

When the model is passed to the Express router's `res.json()` method it triggers the Model instance's built-in `toJson()` method which returns a plain JavaScript object with the Model's schema attributes. You can override the default behaviour of this method to remove sensitive data from the returned attributes.

Add a new method called `toJson` in the `User` model's class definition. It will call the parent implementation inherited from `Sequelize.Model` using the `super` keyword and then remove the `password` attribute.

```js
class User extends Model {
  toJSON () {
    const attributes = super.toJSON()
    delete attributes.password
    return attributes
  }
}
```

This works great, except when the User model is included in the query results of a related model. e.g. `Post.findAll({include: [User]})`

In this case it is the Post model's `.toJson()` method that is returning the attributes and it doesn't know that it should exclude the password.

##### Query Scopes

Most ORMs like Sequelize allow you to create some pre-defined query modifiers for frequent use cases. These named query modifiers are called [query scopes](https://sequelize.org/v5/manual/scopes.html). The scopes are added to the options object (second argument) to the `Model.init()` method.

Add a default scope that excludes the `password` field. And, add a named scope called `withPassword` for when you really do need to retrieve the password from the database -- e.g. user login.

```js
User.init(
  {
    /** schema ... */
  },
  {
    sequelize, // the database connection. you had this already
    defaultScope: {
      attributes: { exclude: ['password'] }
    },
    scopes: {
      withPassword: { attributes: {} }
    }
  }
)
```

## Login

Following RESTful API principles, a User login action results in a new authorization token being created and returned to the client. So, the `user-login` view POSTs the form data to the `/api/auth-tokens` route.

Check out the `02-login` branch for clean starter code and open the `/routes/api/auth-tokens.js` module. A lot of this logic could be better placed in the User model, but we will do it in the route handler for simplicity.

### Verify password

Load the target user based on the `req.body.email` property. You will need to use the `withPassword` scope that you created earlier.

```js
const user = await User.scope('withPassword').findOne({
  where: { email: req.body.email }
})
if (!user) throw new Error('Bad email or password')
```

Verify the password with `argon2`. The `verify` method encrypts the login password and then compares with the encrypted password from the database to see if they match.

```js
const didAuthenticate = await argon2.verify(user.password, req.body.password)
if (!didAuthenticate) throw new Error('Bad email or password')
```

### Create a JWT token

Install the [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) NPM module.

Use the `jwt.sign()` method to encode the `user.id` and sign the token with your 'superSecretKey'. Normally, this key would be stored in an environment variable, but you can hard code it for this demo example.

```js
const token = jwt.sign({ id: user.id }, 'superSecretKey')
res.status(201).json({ data: token })
```

Success!! The user can now login. The token that is returned must be passed in the header of fetch requests to protected routes.

## Protected Routes

The primary reason for having users register and login is to restrict access to certain application features or data resources. One of the most common (and simplest to implement) is a special route to retrieve the current logged-in user's profile.

Check out the `03-auth-middleware` branch for clean starter code and open the `/routes/api/users.js` module.

Add a new **GET /api/users/me** route. This route will take no `req.params`, and no `req.body` data. It will only return the user profile for the user associated with the `Authorization` token in the `req.headers`.

You will need to:

1.  Extract the JWT authentication token from the request headers

    The client application will pass the token in a request header called `Authorization`. The corresponding value will be in the form of `Bearer {{token}}`, where `{{token}}` is a placeholder for the actual JWT. Note the word _Bearer_ is capitalized and followed be a space.

    You can use the `req.header('Authorization')` function to get the token from the request headers and, if the token is missing, send an authentication error.

2.  Verify the JWT and get the user's `id` from the token's payload.

    ```js
    const payload = jwt.verify(token, jwtPrivateKey)
    ```

3.  Find the User from the database using the `id` from the token's payload

    ```js
    const user = await User.findByPk(payload.id)
    ```

4.  Return the User object as JSON

5.  If any of the above steps fail, return an error. Using the [JSON:API standard](https://jsonapi.org/), the response for an error might look like this ...

```js
res.status(401).send({
  errors: [
    {
      status: '401',
      title: 'Authentication failed',
      detail: 'Invalid bearer token'
    }
  ]
})
```

### Extract to middleware

Since getting the currently logged-in user is a common prerequisite for granting access to many route handlers, it is recommended to move this logic into a reusable "middleware" function -- e.g. /middleware/getAuthUser.js

Then, call that middleware function before the main route handler function. If there is a valid user, it will be available on the `req.user` property. Any error conditions are already handled by the `getAuthUser` middleware.

```js
router.get('/me', getAuthUser, async (req, res) =>
  res.status(200).json({ data: req.user })
)
```

### Client side examples

Examine the `user-login.handlebars` and `user-profile.handlebars` modules to see how to save the authentication token to localStorage and then send it in the request headers for protected resource routes.
