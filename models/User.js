import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const Schema = mongoose.Schema
const model = mongoose.model

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    trim: true,
  },
  hash: {
    type: String,
    trim: true,
  },
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'PostModel',
    },
  ],
  commentsMade: [
    {
      type: Schema.Types.ObjectId,
      ref: 'CommentModel',
    },
  ],
})

UserSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (document, retObj) => {
    delete retObj.__v
    delete retObj.hash
  },
})

const UserModel = model('UserModel', UserSchema)

export default UserModel
