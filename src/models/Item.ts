// models/ItemChecklist.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IItemChecklist extends Document {
  title: string;
  description?: string;
}

const ItemChecklistSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
});

export default mongoose.model<IItemChecklist>(
  "ItemChecklist",
  ItemChecklistSchema
);
