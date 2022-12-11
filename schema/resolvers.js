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
import pkg from 'lodash'

const pubsub = new PubSub()

const User = UserModel
const Post = PostModel
const Comment = CommentModel
const secret = process.env.SECRET_KEY

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
        await post.save()
        authUser.posts = authUser.posts.concat(post._id)
        await authUser.save()
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
        commentFor: mongoose.Types.ObjectId(args.id),
      })
      const post = await Post.findById(args.id).populate('comments')
      try {
        await comment.save()
        authUser.comments = authUser.comments.concat(comment._id)
        await authUser.save()
        post.comments = post.comments.concat(comment._id)
        await post.save()
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
  User: {
    email: async (parent, args, contextValue, info) => {
      //console.log('User.email - info', JSON.stringify(info))
      console.log('User.email - parent', parent.email)
      return parent.email
    },
    posts: async (parent, args, contextValue, info) => {
      //console.log('User.posts - info', JSON.stringify(info))
      console.log('User.posts - parent', parent.posts)
      return parent.posts
    },
    commentsMade: async (parent, args, contextValue, info) => {
      //console.log('User.commentsMade - info', JSON.stringify(info))
      console.log('User.commentsMade - parent', parent.commentsMade)
      return parent.commentsMade
    },
  },
  Post: {
    title: async (parent, args, contextValue, info) => {
      //console.log('Post.title - info', JSON.stringify(info))
      console.log('Post.title - parent', parent.title)
      return parent.title
    },
    postedBy: async (parent, args, contextValue, info) => {
      //console.log('Post.postedBy - info', JSON.stringify(info))
      console.log('Post.postedBy - parent', parent.postedBy)
      return parent.postedBy
    },
    comments: async (parent, args, contextValue, info) => {
      //console.log('Post.comments - info', JSON.stringify(info))
      console.log('Post.comments - parent', parent.comments)
      return parent.comments
    },
  },
  Comment: {
    text: async (parent, args, contextValue, info) => {
      //console.log('Comment.text - info', JSON.stringify(info))
      console.log('Comment.text - parent', parent.text)
      return parent.title
    },
    commenter: async (parent, args, contextValue, info) => {
      //console.log('Comment.commenter - info', JSON.stringify(info))
      console.log('Comment.commenter - parent', parent.commenter)
      return parent.commenter
    },
    commentFor: async (parent, args, contextValue, info) => {
      //console.log('Comment.commentFor - info', JSON.stringify(info))
      console.log('Comment.commentFor - parent', parent.commentFor)
      return parent.commentFor
    },
  },
}

export default resolvers
