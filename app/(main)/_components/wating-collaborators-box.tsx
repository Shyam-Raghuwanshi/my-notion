"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { Check, Search, Trash } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const WatingCollaboratorsBox = () => {
  const documents = useQuery(api.documents.getTrash);
  const params = useParams();
  const updateCollaborators = useMutation(api.documents.updateCollaborators);
  const removeCollaborator = useMutation(api.documents.removeCollaborator);
  const [search, setSearch] = useState("");

  const documentId: Id<"documents"> | undefined =
    params?.documentId as Id<"documents">;

  const collaborators = useQuery(api.documents.getCollaboratorsByDocumentId, {
    documentId: documentId,
  });

  const filteredCollaborators = collaborators?.filter((collaborator) => {
    return collaborator.fullName?.toLowerCase().includes(search.toLowerCase());
  });

  const acceptCollaborator = (userId: string) => {
    if (params?.documentId && userId) {
      // Use the mutate function from useMutation
      const promise = updateCollaborators({
        id: documentId,
        collaborators: [
          {
            userId,
            collabAccepted: true,
            admin: false,
          },
        ],
      });

      toast.promise(promise, {
        loading: "Addin collaborator...",
        success: "Collaborator added!",
        error: " Failed to adding collaborator.",
      });
    }
  };

  const handleRemoveCollaborator = async (collaboratorUserId: string) => {
    const promise = removeCollaborator({
      documentId: documentId,
      collaboratorUserId,
    });

    toast.promise(promise, {
      loading: "Removing request...",
      success: "Request removed!",
      error: " Failed to removing request.",
    });
  };

  if (documents === undefined) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="flex items-center gap-x-1 p-2">
        <Search className="h-4 w-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 px-2 focus-visible:ring-transparent bg-secondary"
          placeholder="Filter by collaborator name..."
        />
      </div>
      <div className="mt-2 px-1 pb-1">
        <p className="hidden last:block text-xs text-center text-muted-foreground pb-2">
          No request found.
        </p>
        {filteredCollaborators?.map((collaborator) => {
          if (!collaborator.collabAccepted) {
            return (
              <div
                key={collaborator.userId}
                className="text-sm rounded-sm w-full flex items-center text-primary justify-between cursor-default"
              >
                <Avatar>
                  <AvatarImage
                    className="h-10 w-10"
                    src={collaborator.imageUrl}
                  />
                  <AvatarFallback>
                    {collaborator.fullName?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate pl-2">{collaborator.fullName}</span>
                <div className="flex items-center">
                  <Button
                    onClick={() => acceptCollaborator(collaborator.userId)}
                    size="sm"
                    className="text-[10px] h-6 w-13 m-2 bg-primary/5 text-primary hover:bg-primary/10"
                  >
                    Accept
                  </Button>

                  <Button
                    onClick={() => {
                      handleRemoveCollaborator(collaborator.userId);
                    }}
                    size="sm"
                    className="text-[10px] h-6 w-13 bg-primary/5 text-primary hover:bg-primary/10"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          }

          // Return null if collabAccepted is false
          return null;
        })}
      </div>
    </div>
  );
};
