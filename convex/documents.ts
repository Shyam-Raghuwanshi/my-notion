import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const removeCoverImage = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.patch(args.id, {
      coverImage: undefined,
    });

    return document;
  },
});

export const removeIcon = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.patch(args.id, {
      icon: undefined,
    });

    return document;
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject;

    const { id, ...rest } = args;
    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (
      existingDocument.userId !== userId &&
      !existingDocument.collaborators?.some(
        (collab) => collab.userId === userId && collab.collabAccepted
      )
    ) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      ...rest,
    });

    // Return the updated content, not the existing content
    return rest.content || existingDocument.content;
  },
});

export const getById = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const document = await ctx.db.get(args.documentId);

    if (!document) {
      throw new Error("Not found");
    }

    if (document.isPublished && !document.isArchived) {
      return document;
    }

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    // Allow access if the user is the document owner or has collabAccepted set to true
    if (
      document.userId !== userId &&
      !document.collaborators?.some(
        (collab) => collab.userId === userId && collab.collabAccepted
      )
    ) {
      return;
    }

    return document;
  },
});

export const getSearch = query({
  handler: async (ctx) => {
    const identity = await ctx?.auth?.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const document = await ctx.db.delete(args.id);

    return document;
  },
});

export const restore = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const recursiveRestore = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: false,
        });

        await recursiveRestore(child._id);
      }
    };

    const options: Partial<Doc<"documents">> = {
      isArchived: false,
    };

    if (existingDocument.parentDocument) {
      const parent = await ctx.db.get(existingDocument.parentDocument);
      if (parent?.isArchived) {
        options.parentDocument = undefined;
      }
    }

    const document = await ctx.db.patch(args.id, options);

    recursiveRestore(args.id);

    return document;
  },
});

export const getTrash = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    return documents;
  },
});

export const archive = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const recursiveArchive = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: true,
        });

        await recursiveArchive(child._id);
      }
    };

    const document = await ctx.db.patch(args.id, {
      isArchived: true,
    });

    recursiveArchive(args.id);

    return document;
  },
});

export const getSidebar = query({
  args: {
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", userId).eq("parentDocument", args.parentDocument)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();
    return documents;
  },
});

export const get = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const documents = await ctx.db.query("documents").collect();

    return documents;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const document = await ctx.db.insert("documents", {
      title: args.title,
      parentDocument: args.parentDocument,
      userId,
      isArchived: false,
      isPublished: false,
    });

    return document;
  },
});

// get the collaborators array using documentId.
export const getCollaboratorsByDocumentId = query({
  args: {
    documentId: v.optional(v.id("documents")),
  },
  handler: async (ctx, { documentId }) => {
    if (!documentId) {
      return;
    }

    const document = await ctx.db.get(documentId);

    if (!document) {
      throw new Error("Document not found");
    }

    return document.collaborators || [];
  },
});

// update the collaborators array
export const updateCollaborators = mutation({
  args: {
    id: v.id("documents"),
    collaborators: v.optional(
      v.array(
        v.object({
          userId: v.string(),
          collabAccepted: v.boolean(),
          admin: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject;
    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    if (
      existingDocument.userId !== userId &&
      !existingDocument?.collaborators?.some(
        (collab) => collab.userId === userId
      )
    ) {
      throw new Error("Unauthorized");
    }

    // Ensure that collaborators is initialized as an empty array if it's undefined
    const collaborators = existingDocument.collaborators || [];

    // Find the index of the collaborator with the specified userId
    const collaboratorIndex = collaborators.findIndex(
      (collab) => collab.userId === args.collaborators?.[0]?.userId
    );

    if (collaboratorIndex !== undefined && collaboratorIndex !== -1) {
      // Update the existing collaborator at the found index
      collaborators[collaboratorIndex] = {
        ...collaborators[collaboratorIndex],
        ...args.collaborators?.[0],
      };
    }

    // Update the document with the modified collaborators array
    const updatedDocument = await ctx.db.patch(args.id, {
      collaborators: collaborators,
    });

    return updatedDocument;
  },
});

// create collbaborator
export const addCollaborator = mutation({
  args: {
    documentId: v.id("documents"),
    collaborator: v.object({
      userId: v.string(),
      collabAccepted: v.boolean(),
      fullName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      admin: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }
    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.documentId);

    if (!existingDocument) {
      throw new Error("Document not found");
    }

    if (existingDocument.userId === userId) {
      return "ADMIN";
    }

    // Check if the collaborator already exists in the collaborators array
    const existingCollaborator = existingDocument.collaborators?.find(
      (collab) => collab.userId === args.collaborator.userId
    );

    if (existingCollaborator) {
      return;
    }

    // Add the new collaborator to the collaborators array
    const updatedCollaborators = [
      ...(existingDocument.collaborators || []), // Copy existing collaborators if any
      args.collaborator,
    ];

    // If the user is the owner, add them as a collaborator with admin privileges
    if (existingDocument.userId === userId) {
      updatedCollaborators.push({
        userId,
        collabAccepted: true,
        fullName: args.collaborator.fullName,
        imageUrl: args.collaborator.imageUrl,
        admin: true,
      });
    }

    const updatedDocument = await ctx.db.patch(args.documentId, {
      collaborators: updatedCollaborators,
    });

    return updatedDocument;
  },
});

// remove collaborator
export const removeCollaborator = mutation({
  args: {
    documentId: v.id("documents"),
    collaboratorUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.documentId);

    if (!existingDocument) {
      throw new Error("Not found");
    }

    // Check if the user is the document owner or an admin collaborator
    if (
      existingDocument.userId !== userId &&
      !existingDocument?.collaborators?.some(
        (collab) => collab.userId === userId
      )
    ) {
      throw new Error("Unauthorized shyam");
    }

    // Filter out the collaborator to be removed
    const updatedCollaborators = existingDocument?.collaborators?.filter(
      (collab) => collab.userId !== args.collaboratorUserId
    );

    // Update the document with the new collaborators array
    const updatedDocument = await ctx.db.patch(args.documentId, {
      collaborators: updatedCollaborators,
    });

    return updatedDocument;
  },
});
