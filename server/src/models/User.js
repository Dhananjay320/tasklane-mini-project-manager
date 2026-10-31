import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => ({ id: ret._id.toString(), name: ret.name, email: ret.email, createdAt: ret.createdAt }),
});

export const User = mongoose.model('User', userSchema);
