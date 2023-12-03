"use client";

import { useMutation, useQuery } from "convex/react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Toolbar } from "@/components/toolbar";
import { Cover } from "@/components/cover";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/clerk-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Title } from "@/app/(main)/_components/title";
import { Invite } from "@/app/(main)/_components/invite";
import { Menu } from "@/app/(main)/_components/menu";
import { Publish } from "@/app/(main)/_components/publish";
import { Banner } from "@/app/(main)/_components/banner";
import { X } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DocumentIdPageProps {
  params: {
    documentId: Id<"documents">;
  };
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const { user } = useUser();
  const router = useRouter();
  const Editor = useMemo(
    () => dynamic(() => import("@/components/editor"), { ssr: false }),
    []
  );

  const addCollaborator = useMutation(api.documents.addCollaborator);
  const removeCollaborator = useMutation(api.documents.removeCollaborator);

  const document = useQuery(api.documents.getById, {
    documentId: params?.documentId,
  });

  const addCollaboratorsFun = async () => {
    // Check if both params and user are defined
    if (params?.documentId && user?.id) {
      // Use the mutate function from useMutation
      const result = await addCollaborator({
        documentId: params.documentId,
        collaborator: {
          userId: user.id,
          collabAccepted: false,
          fullName: `${user.fullName}`,
          imageUrl: user.imageUrl,
          admin: false,
        },
      });

      if (result === "ADMIN") {
        window.location.href = `/documents/${params.documentId}`;
      }
    }
  };

  useEffect(() => {
    // create Collaborator with `collabAccepted` field false when any user visits the page
    addCollaboratorsFun();
  }, []);

  const collaborator = document?.collaborators?.find(
    (collaborator) => collaborator.userId === user?.id
  );

  const handleRemoveCollaborator = async (collaboratorUserId: string) => {
    const promise = removeCollaborator({
      documentId: params?.documentId,
      collaboratorUserId,
    });

    toast.promise(promise, {
      loading: "Exiting collab...",
      success: "You Exit the collab.",
      error: " Failed to exit collab.",
    });
    router.push("/documents");
  };

  if (document === undefined) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-[50%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </div>
    );
  }
  if (document === null || !collaborator?.collabAccepted) {
    return (
      <Dialog open={true}>
        <DialogContent>
          <h2 className="text-lg font-medium">
            Wait! while your request not accepted...
          </h2>
          <Separator />
          <div className="flex items-center justify-between">
            <Spinner size="lg" />
            <Link href="/documents">
              <Button>Back to home</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <nav className="bg-background dark:bg-[#1F1F1F] px-3 py-2 w-full flex items-center gap-x-4">
        <div className="flex items-center justify-between w-full">
          <Title initialData={document} />

          <div className="flex items-center gap-x-2">
            {collaborator?.admin && (
              <>
                <Invite Id={document._id} />
                <Publish initialData={document} />
                <Menu documentId={document._id} />
              </>
            )}
            <HoverCard>
              <HoverCardTrigger>
                <ConfirmModal
                  onConfirm={() => {
                    handleRemoveCollaborator(`${collaborator?.userId}`);
                  }}
                >
                  <Button
                    size="icon"
                    className="bg-primary/5 text-primary hover:bg-primary/10 text-rose-600 rounded-full"
                  >
                    <X />
                  </Button>
                </ConfirmModal>
              </HoverCardTrigger>
              <HoverCardContent side="left" className="w-30">
                Leave Collab
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </nav>
      {document.isArchived && <Banner documentId={document._id} />}
      <div className="pb-40">
        <Cover url={document.coverImage} />
        <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
          <Toolbar initialData={document} />
          <Editor initialData={document} />
        </div>
      </div>
    </>
  );
};

export default DocumentIdPage;
