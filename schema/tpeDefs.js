const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    posts: [Post]!
    commentsMade: [Comment]!
  }

  type Token {
    value: String!
  }

  input UpdatePostInput {
    title: String!
  }

  type Post {
    id: ID!
    title: String!
    postedBy: User
    comments: [Comment]!
  }

  input CommentInput {
    text: String!
  }


  type Comment {
    id: ID!
    text: String!
    commenter: User!
    commentFor: Post!
  }

  type Query {
    users: [User]!
    user(id: ID!): User!
    posts: [Post!]!
    post(id: ID!): Post!
    comment(id: ID!): Comment!
    comments: [Comment!]!
    
  }

  type Mutation {
    signup(email: String!, password: String!): User
    signin(email: String!, password: String!): Token
    createPost(title: String): Post
    createComment(postId: String!, commentInput: CommentInput!): Comment
    updatePost(postId: ID!, updatePostInput: UpdatePostInput!): Post
  }
  type Subscription {
    postAdded: Post
    commentAdded: Comment
    postUpdated: Post
  }
`

export default typeDefs
