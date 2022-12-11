import dotenv from 'dotenv'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import express from 'express'
import http from 'http'
import cors from 'cors'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import UserModel from './models/User.js'
import typeDefs from './schema/tpeDefs.js'
import resolvers from './schema/resolvers.js'
import mongoose from 'mongoose'
dotenv.config()

mongoose.set('strictQuery', false)
let db_uri
const options = {
  autoIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
}
if (process.env.NODE_ENV === 'development') {
  db_uri = process.env.MONGO_DEV
}

mongoose.connect(db_uri, options).then(
  () => {
    console.log('Database connected')
  },
  (err) => {
    console.log(err)
  }
)

const startGraphQLServer = async () => {
  const app = express()
  const httpServer = http.createServer(app)

  const schema = makeExecutableSchema({ typeDefs, resolvers })

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/',
  })

  const serverCleanup = useServer({ schema }, wsServer)

  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const authHeader = req.headers['authorization']
      const token = authHeader && authHeader.split(' ')[1]
      if (token) {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
        const authUser = await UserModel.findById(decoded.id)
          .populate('commentsMade')
          .populate('posts')
        return { authUser }
      }
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose()
            },
          }
        },
      },
    ],
  })
  await server.start()
  app.use(
    '/',
    cors(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if (token) {
          const decoded = jwt.verify(token, process.env.TOKEN_SECRET)
          const authUser = await UserModel.findById(decoded.id)
            .populate('commentsMade')
            .populate('posts')
          return { authUser }
        }
      },
    })
  )

  const PORT = 4000

  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}`)
  )
}

startGraphQLServer()
