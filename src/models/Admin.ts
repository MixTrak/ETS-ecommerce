import mongoose, { Document, Schema, Model } from 'mongoose';

export type AdminRole = 'owner' | 'admin' | 'manager';

export interface IAdmin extends Document {
  email: string;
  password: string;
  role: AdminRole;
  fullName: string;
  createdBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminPermissions {
  canCreateUsers: boolean;
  canDeleteUsers: boolean;
  canCreateProducts: boolean;
  canDeleteProducts: boolean;
  canCreateAdmins: boolean;
}

// 1. Define a custom interface for the Admin model that includes the static method
interface IAdminModel extends Model<IAdmin> {
  getPermissions(role: AdminRole): AdminPermissions;
}

const AdminSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'manager'],
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

AdminSchema.statics.getPermissions = function(role: AdminRole): AdminPermissions {
  const permissions = {
    owner: {
      canCreateUsers: true,
      canDeleteUsers: true,
      canCreateProducts: true,
      canDeleteProducts: true,
      canCreateAdmins: true,
    },
    admin: {
      canCreateUsers: false,
      canDeleteUsers: true,
      canCreateProducts: true,
      canDeleteProducts: true,
      canCreateAdmins: false,
    },
    manager: {
      canCreateUsers: false,
      canDeleteUsers: false,
      canCreateProducts: true,
      canDeleteProducts: true,
      canCreateAdmins: false,
    },
  };
  
  return permissions[role];
};

// 2. Use the new IAdminModel interface when exporting the model
export default (mongoose.models.Admin as IAdminModel) || mongoose.model<IAdmin, IAdminModel>('Admin', AdminSchema);