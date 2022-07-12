import { model, Schema } from "mongoose";
import { IStoredVc } from "../storage-driver.types";

const StoredVcSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  issuer: {
    type: String,
    required: true,
  },
  type: {
    type: [{ type: String }],
    required: true,
  },
  credential: {
    type: Object,
    required: true,
  },
});

export const StoredVc = model<IStoredVc>("StoredVc", StoredVcSchema);
