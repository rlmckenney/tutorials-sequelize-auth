# API Authentication

As you develop your apps beyond the simple prototype stage, you will quickly have a requirement to restrict some content or features to registered users. For example in a blog application anyone should be able to read the articles, but only authorized users should be able to create new posts, and only the original author should be able to edit their posts.

There are several techniques for managing user registration and authentication:

- Session keys
- JavaScript Web Tokens (JWT)
- OAuth / social login

There are many libraries and SaaS services that can help manage this in your application. e.g.

- Passport.js
- Auht0
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

Check out the `02-login` branch.

## Protected Routes

Check out the `03-auth-middleware` branch.
