"use client";

import {
  Check,
  HeartHandshake,
  MoreVertical,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { ConfirmModal } from "@/components/modals/confirm-modal";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface messagesInterface {
  loading: string;
  success: string;
  error: string;
}

const Messages = {
  removeCollaboratorMessage: {
    loading: "Removing collaborator...",
    success: "Collaborator removed!",
    error: "Failed to remove collaborator.",
  },
  deleteCollaboratorMessage: {
    loading: "Deleting collaborator...",
    success: "Collaborator deleted!",
    error: "Failed to delete collaborator.",
  },
  makingAdminMessage: {
    loading: "Making admin...",
    success: "Admin status updated!",
    error: "Failed to update admin status.",
  },
  makingCollaboratorMessage: {
    loading: "Making collaborator...",
    success: "Collaborator status updated!",
    error: "Failed to update collaborator status.",
  },
};

export const CollaboratorsBox = () => {
  const params = useParams();
  const [search, setSearch] = useState("");
  const documents = useQuery(api.documents.getTrash);
  const updateCollaborators = useMutation(api.documents.updateCollaborators);
  const removeCollaborator = useMutation(api.documents.removeCollaborator);

  const documentId: Id<"documents"> | undefined =
    params?.documentId as Id<"documents">;

  const collaborators = useQuery(api.documents.getCollaboratorsByDocumentId, {
    documentId: documentId,
  });

  const filteredCollaborators = collaborators?.filter((collaborator) => {
    return collaborator.fullName?.toLowerCase().includes(search.toLowerCase());
  });

  // handle removing the request and handle the using either admin or collaborator
  const handleCollaborator = (
    userId: string,
    collabAccepted: boolean,
    admin: boolean,
    messages: messagesInterface
  ) => {
    if (params?.documentId && userId) {
      // Use the mutate function from useMutation
      const promise = updateCollaborators({
        id: documentId,
        collaborators: [
          {
            userId,
            collabAccepted,
            admin,
          },
        ],
      });
      toast.promise(promise, {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      });
    }
  };

  // handle complete reomve the user
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
          No collaborator found.
        </p>
        {filteredCollaborators?.map((collaborator) => {
          if (collaborator.collabAccepted) {
            return (
              <div
                key={collaborator.userId}
                role="button"
                className="text-sm rounded-sm w-full cursor-default flex items-center text-primary justify-between"
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
                    onClick={() =>
                      handleCollaborator(
                        collaborator.userId,
                        false,
                        false,
                        Messages.removeCollaboratorMessage
                      )
                    }
                    size="sm"
                    className="text-[10px] h-6 w-13 bg-primary/5 text-primary hover:bg-primary/10 mr-1"
                  >
                    Remove
                  </Button>
                  <Popover>
                    <PopoverTrigger>
                      <div className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent side="top">
                      <HoverCard>
                        <HoverCardTrigger>
                          <div
                            onClick={() =>
                              handleCollaborator(
                                collaborator.userId,
                                true,
                                true,
                                Messages.makingAdminMessage
                              )
                            }
                            role="button"
                            className={cn(
                              "text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between py-2 mb-1",
                              collaborator.admin &&
                                "opacity-50 pointer-events-none"
                            )}
                          >
                            <div className="flex justify-between items-center">
                              {" "}
                              <ShieldCheck className="h-4 w-4 ml-1 text-blue-600" />
                              <span className="ml-1">ADMIN</span>
                            </div>
                            {collaborator.admin && (
                              <Check className="h-4 w-4" />
                            )}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="right">
                          @Admins have the authority to make notes public,
                          delete them, and share the invite link.
                        </HoverCardContent>
                      </HoverCard>
                      <HoverCard>
                        <HoverCardTrigger>
                          <div
                            onClick={() =>
                              handleCollaborator(
                                collaborator.userId,
                                true,
                                false,
                                Messages.makingCollaboratorMessage
                              )
                            }
                            role="button"
                            className={cn(
                              "text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between py-2 mb-1",
                              !collaborator.admin &&
                                "opacity-40 pointer-events-none"
                            )}
                          >
                            <div className="flex justify-between items-center">
                              {" "}
                              <HeartHandshake className="h-4 w-4 ml-1 text-yellow-600" />
                              <span className="ml-1">Collaborator</span>
                            </div>
                            {!collaborator.admin && (
                              <Check className="h-4 w-4" />
                            )}
                          </div>
                          <HoverCardContent side="right">
                            @Collaborator only edit the Note.
                          </HoverCardContent>
                        </HoverCardTrigger>
                      </HoverCard>
                      <Separator className="my-2" />
                      <ConfirmModal
                        onConfirm={() => {
                          handleRemoveCollaborator(collaborator.userId);
                        }}
                      >
                        <div
                          role="button"
                          className="text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-center py-2 text-rose-600"
                        >
                          Delete
                        </div>
                      </ConfirmModal>
                    </PopoverContent>
                  </Popover>
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
