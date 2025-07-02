import mongoose, { Document, Schema } from "mongoose";

export interface IChecklist extends Document {
  name: string;
  checklistCompletionStatus: boolean;
  createdAt: Date;
  items: {
    itemChecklist: mongoose.Types.ObjectId;
    completionStatus: boolean;
  }[];
}

const ChecklistSchema: Schema = new Schema({
  name: { type: String, required: true },
  checklistCompletionStatus: { type: Boolean, default: false },
  items: {
    type: [
      {
        itemChecklist: {
          type: Schema.Types.ObjectId,
          ref: "ItemChecklist",
          required: true,
        },
        completionStatus: { type: Boolean, default: false },
      },
    ],
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IChecklist>("Checklist", ChecklistSchema);
