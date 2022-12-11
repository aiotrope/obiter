/* eslint-disable no-unused-vars */
import dotenv from 'dotenv'
dotenv.config()
import { PubSub } from 'graphql-subscriptions'
import mongoose from 'mongoose'
import { GraphQLError } from 'graphql'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import UserModel from '../models/User.js'
import PostModel from '../models/Post.js'
import CommentModel from '../models/Comment.js'

const pubsub = new PubSub()
const User = UserModel
const Post = PostModel
const Comment = CommentModel
const secret = process.env.TOKEN_SECRET
const resolvers = {
  Query: {
    users: async () => {
      try {
        const users = await User.find({})
          .populate('posts')
          .populate('commentsMade')
        return users
      } catch (error) {
        console.error(error.message)
      }
    },
    user: async (parent, args) => {
      const user = await User.findById(args.id)
        .populate('posts')
        .populate('commentsMade')
      return user
    },
    posts: async () => {
      try {
        const posts = await Post.find({})
          .populate('postedBy')
          .populate('comments')
        return posts
      } catch (error) {
        console.error(error.message)
      }
    },
    post: async (parent, args) => {
      try {
        const post = await Post.findById(args.id)
          .populate('postedBy')
          .populate('comments')
        return post
      } catch (error) {
        console.error(error.message)
      }
    },
    comments: async () => {
      try {
        const comments = await Comment.find({})
          .populate('commenter')
          .populate('commentFor')
        return comments
      } catch (error) {
        console.error(error.message)
      }
    },
    comment: async (parent, args) => {
      try {
        const comment = await Comment.findById(args.id)
          .populate('commenter')
          .populate('commentFor')
        return comment
      } catch (error) {
        console.error(error.message)
      }
    },
  },
  Mutation: {
    signup: async (_, args) => {
      try {
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(args.password, salt)
        const user = new User({ email: args.email, hash: hash })
        await user.save()
        return user
      } catch (error) {
        throw new GraphQLError(`Error: ${error.message}`, {
          extensions: { code: 'BAD_USER_INPUT', http: { status: 400 } },
        })
      }
    },
    signin: async (_, args) => {
      try {
        const user = await User.findOne({ email: args.email })
        const checkPassword = bcrypt.compare(args.password, user.hash)

        if (!user || !checkPassword) {
          throw new GraphQLError('Incorrect credentials', {
            extensions: { code: 'BAD_USER_INPUT', http: { status: 400 } },
          })
        }
        const token = jwt.sign({ email: user.email, id: user._id }, secret)
        return { value: token }
      } catch (error) {
        throw new GraphQLError(`Error: ${error.message}`, {
          extensions: { code: 'BAD_USER_INPUT', http: { status: 400 } },
        })
      }
    },
    createPost: async (_, args, contextValue) => {
      const authUser = contextValue.authUser
      if (!authUser) {
        throw new GraphQLError('User is not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        })
      }
      const post = new Post({
        ...args,
        postedBy: mongoose.Types.ObjectId(authUser.id),
      })
      try {
        const savedPost = await post.save()
        authUser.posts = authUser.posts.concat(post._id)
        await authUser.save()

        const addedPost = {
          id: savedPost.id,
          title: savedPost.title,
          postedBy: savedPost.postedBy,
          comments: savedPost.comments,
        }

        pubsub.publish('POST_ADDED', { postAdded: addedPost })

        return post
      } catch (error) {
        throw new GraphQLError(`Error: ${error.message}`, {
          extensions: {
            code: 'BAD_USER_INPUT',
            http: { status: 400 },
            arguementName: args,
          },
        })
      }
    },
    updatePost: async (_, args, contextValue) => {
      const authUser = contextValue.authUser
      if (!authUser) {
        throw new GraphQLError('User is not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        })
      }
      try {
        const post = await Post.findByIdAndUpdate(
          args.postId,
          args.updatePostInput,
          { new: true }
        )
          .populate('comments')
          .populate('postedBy')

        const updatedPost = {
          id: post.id,
          title: post.title,
          postedBy: post.postedBy,
          comments: post.comments,
        }
        pubsub.publish('POST_UPDATED', { postUpdated: updatedPost })
        return post
      } catch (error) {
        throw new GraphQLError(`Error: ${error.message}`, {
          extensions: {
            code: 'BAD_REQUEST',
            http: { status: 400 },
            arguementName: args,
          },
        })
      }
    },
    createComment: async (_, args, contextValue) => {
      const authUser = contextValue.authUser
      if (!authUser) {
        throw new GraphQLError('User is not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        })
      }
      const comment = new Comment({
        text: args.commentInput.text,
        commenter: mongoose.Types.ObjectId(authUser.id),
        commentFor: mongoose.Types.ObjectId(args.postId),
      })
      const post = await Post.findById(args.postId)
        .populate('comments')
        .populate('postedBy')
      try {
        const savedComment = await comment.save()
        authUser.commentsMade = authUser.commentsMade.concat(comment._id)
        await authUser.save()
        post.comments = post.comments.concat(comment._id)
        await post.save()

        const addedComment = {
          id: savedComment.id,
          text: savedComment.text,
          commenter: savedComment.commenter,
          commentFor: savedComment.commentFor,
        }
        pubsub.publish('COMMENT_ADDED', { commentAdded: addedComment })
        return comment
      } catch (error) {
        throw new GraphQLError(`Error: ${error.message}`, {
          extensions: {
            code: 'BAD_USER_INPUT',
            http: { status: 400 },
            arguementName: args,
          },
        })
      }
    },
  },
  Subscription: {
    postAdded: {
      subscribe: () => pubsub.asyncIterator('POST_ADDED'),
    },
    commentAdded: {
      subscribe: () => pubsub.asyncIterator('COMMENT_ADDED'),
    },
    postUpdated: {
      subscribe: () => pubsub.asyncIterator('POST_UPDATED'),
    },
  },
  User: {
    id: async (parent, args, contextValue, info) => {
      return parent.id
    },
    email: async (parent, args, contextValue, info) => {
      return parent.email
    },
    posts: async (parent, args, contextValue, info) => {
      return parent.posts
    },
    commentsMade: async (parent, args, contextValue, info) => {
      return parent.commentsMade
    },
  },
  Post: {
    id: async (parent, args, contextValue, info) => {
      return parent.id
    },
    title: async (parent) => {
      return parent.title
    },
    postedBy: async (parent) => {
      const user = await User.findById(parent.postedBy)
        .populate('posts', { id: 1, title: 1, comments: 1, postedBy: 1 })
        .populate('commentsMade')
      //console.log('id', user.id)
      //console.log('email', user.email)
      return user
    },
    comments: async (parent) => {
      return parent.comments
    },
  },
  Comment: {
    id: async (parent, args, contextValue, info) => {
      return parent.id
    },
    text: async (parent, args, contextValue, info) => {
      return parent.text
    },
    commenter: async (parent, args, contextValue, info) => {
      const user = await User.findById(parent.commenter)
        .populate('posts')
        .populate('commentsMade')
      return user
    },
    commentFor: async (parent, args, contextValue, info) => {
      const post = await Post.findById(parent.commentFor)
        .populate('comments')
        .populate('postedBy')
      return post
    },
  },
}

export default resolvers
