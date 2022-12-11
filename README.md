# obiter

## 😎 To Start

**Clone the project**

```
$ git clone git@github.com:aiotrope/obiter.git myproject
$ cd myproject
```

**Install the dependencies**

```
$ npm install
```

**Create `.env` file at the root of the project directory and setup the `environment variables`.**
The 2 required variables are: `MONGO_DEV`, and `TOKEN_SECRET`.
e.g.

```bash
# .env

MONGO_DEV=mongodb://localhost:27017/mydb # MongoDB URL connection string
JWT_KEY=b2e5943db539285644c838de0015a3ffc2c2cf3a11104adeb280a06cb0ba46f3fc70503d7b5a4d66362050ff01236161 # as secret key
```

**Run the code**

```bash

# serve backend at localhost:4000
$ npm run dev
```

### 🤖 Model Fields & References

**User Model**

- email: String
- hash: hashed password
- posts: Array of posts made by the user; reference to PostModel
- commnentsMade: Array of comments created by the user; reference to CommentModel

**Post Model**

- title: String
- postedBy: Object; reference to user who create the post
- comments: Array of comments belong to the post

**Comment Model**

- text: String
- commenter: Object; reference to user who made the comment
- commentFor: Object; reference to PostModel for which the comment is made

### 🧩 Sample queries, mutations and subscriptions

_User Signup_

```js
   mutation SIGNUP($email: String!, $password: String!) {
  signup(email: $email, password: $password) {
    id
    email
    posts {
      id
    }
    commentsMade {
      id
    }
  }
}

```

_Login_

```js
   mutation SIGNIN($email: String!, $password: String!) {
  signin(email: $email, password: $password) {
    value
  }
}

```

_Post Creation_

require authorization token

```js
mutation CREATE_POST($title: String) {
  createPost(title: $title) {
    id
    title
    comments {
      id
      text
    }
    postedBy {
      id
      email
    }
  }
}

```

_All Posts_

```js
query POSTS {
  posts {
    id
    title
    comments {
      id
      text
    }
    postedBy {
      id
      email
    }
  }
}

```

_Post Subscription_

require authorization token

```js
subscription POST_ADDED {
  postAdded {
    id
    title
    comments {
      id
      text
    }
    postedBy {
      id
      email
    }
  }
}

```

_Update Post_

require authorization token

```js
    mutation UPDATE_POST($postId: ID!, $updatePostInput: UpdatePostInput!) {
    updatePost(postId: $postId, updatePostInput: $updatePostInput) {
    id
    title
    comments {
      id
      text
    }
    postedBy {
      id
      email
    }
  }
}

```

_Updated Post Subscription_

require authorization token

```js
subscription POST_UPDATED {
  postUpdated {
    id
    title
    comments {
      id
      text
    }
    postedBy {
      id
      email
    }
  }
}

```

_Create Comment_

require authorization token

```js
mutation CREATE_COMMENT($postId: String!, $commentInput: CommentInput!) {
  createComment(postId: $postId, commentInput: $commentInput) {
    id
    text
    commenter {
      id
      email
    }
    commentFor {
      id
      title
    }
  }
}

```

_All Comments_

```js
query COMMENTS {
  comments {
    id
    text
    commentFor {
      id
      title
    }
    commenter {
      id
      email
    }
  }
}

```

_Comment Subscription_

require authorization token

```js
subscription COMMENT_ADDED {
  commentAdded {
    id
    text
    commenter {
      id
      email
    }
    commentFor {
      id
      title
    }
  }
}


```
