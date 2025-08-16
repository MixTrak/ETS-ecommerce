import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  password?: string; // Optional for OAuth users
  provider: 'email' | 'google';
  providerId?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: function(this: IUser) {
        return this.provider === 'email';
      },
      trim: true,
    },
    password: {
      type: String,
      required: function(this: IUser) {
        return this.provider === 'email';
      },
      minlength: 6,
    },
    provider: {
      type: String,
      enum: ['email', 'google'],
      default: 'email',
    },
    providerId: {
      type: String,
      sparse: true,
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes are already defined in the schema field definitions

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
