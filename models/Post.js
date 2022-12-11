import mongoose from 'mongoose'

const Schema = mongoose.Schema
const model = mongoose.model

const PostSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'UserModel',
  },
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'CommentModel',
    },
  ],
})

PostSchema.virtual('id').get(function () {
  return this._id.toHexString()
})
PostSchema.set('toJSON', {
  virtuals: true,
  transform: (document, retObj) => {
    delete retObj.__v
  },
})

const PostModel = model('PostModel', PostSchema)

export default PostModel
