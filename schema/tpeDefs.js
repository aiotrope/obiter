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

  type Post {
    id: ID!
    title: String!
    postedBy: User!
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
    user: User!
    posts: [Post!]!
    post: Post!
    comments: [Comment!]!
    comment: Comment!
  }

  type Mutation {
    signup(email: String!, password: String!): User
    signin(email: String!, password: String!): Token
    createPost(title: String): Post
    createComment(id: ID!, commentInput: CommentInput): Comment
  }
`

export default typeDefs
