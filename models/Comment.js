import mongoose from 'mongoose'

const Schema = mongoose.Schema
const model = mongoose.model

const CommentSchema = new Schema({
  text: {
    type: String,
    trim: true,
  },
  commenter: {
    type: Schema.Types.ObjectId,
    ref: 'UserModel',
  },
  commentFor: {
    type: Schema.Types.ObjectId,
    ref: 'PostModel',
  },
})

CommentSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

CommentSchema.set('toJSON', {
  virtuals: true,
  transform: (document, retObj) => {
    delete retObj.__v
  },
})

const CommentModel = model('CommentModel', CommentSchema)

export default CommentModel
