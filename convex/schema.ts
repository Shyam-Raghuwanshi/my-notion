import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    parentDocument: v.optional(v.id("documents")),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.boolean(),
    collaborators: v.optional(
      v.array(
        v.object({
          userId: v.string(),
          fullName: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
          collabAccepted: v.boolean(),
          admin: v.boolean(),
        })
      )
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_parent", ["userId", "parentDocument"]),
});
