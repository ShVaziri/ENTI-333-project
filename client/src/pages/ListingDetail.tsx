import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Listing, User } from "@shared/schema";

type ListingWithUser = Listing & { user: User };

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: listing, isLoading } = useQuery<ListingWithUser>({
    queryKey: ["/api/listings", id],
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest("POST", "/api/conversations", {
        listingId: id,
      });
      return result;
    },
    onSuccess: () => {
      setLocation("/messages");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMessageSeller = () => {
    createConversationMutation.mutate();
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-8 px-4">
          <div className="mx-auto max-w-6xl space-y-4">
            <Skeleton className="h-10 w-32" />
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-4">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              </div>
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-60 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-8 px-4">
          <div className="mx-auto max-w-6xl">
            <Card className="p-12">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Listing Not Found</h3>
                <p className="text-muted-foreground">
                  This listing may have been removed or doesn't exist.
                </p>
                <Button asChild>
                  <Link href="/">Back to Browse</Link>
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const isOwnListing = user?.id === listing.userId;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="mx-auto max-w-6xl space-y-6">
          <Button variant="ghost" asChild data-testid="button-back">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Link>
          </Button>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Image Section */}
            <div className="lg:col-span-3">
              <Card className="overflow-hidden">
                {listing.imageUrl ? (
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="w-full aspect-[3/4] object-cover"
                    data-testid="img-listing"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">No image available</span>
                  </div>
                )}
              </Card>
            </div>

            {/* Details Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="lg:sticky lg:top-24">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge data-testid="badge-course-code">{listing.courseCode}</Badge>
                    <Badge variant={listing.status === "Active" ? "default" : "secondary"} data-testid="badge-status">
                      {listing.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold leading-tight" data-testid="text-title">
                      {listing.title}
                    </h1>
                    {listing.author && (
                      <p className="text-muted-foreground" data-testid="text-author">
                        by {listing.author}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-primary" data-testid="text-price">
                      ${parseFloat(listing.price).toFixed(2)}
                    </span>
                    <Badge variant="secondary" data-testid="badge-condition">
                      {listing.condition}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Separator />

                  {/* Seller Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Seller</h3>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={listing.user.profileImageUrl || undefined}
                          alt={listing.user.firstName || "Seller"}
                        />
                        <AvatarFallback>{getInitials(listing.user)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" data-testid="text-seller-name">
                          {listing.user.firstName && listing.user.lastName
                            ? `${listing.user.firstName} ${listing.user.lastName}`
                            : listing.user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Listed {new Date(listing.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {listing.description && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h3 className="font-semibold">Description</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-description">
                          {listing.description}
                        </p>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Action Button */}
                  {!isOwnListing && listing.status === "Active" && (
                    <Button
                      className="w-full"
                      onClick={handleMessageSeller}
                      disabled={createConversationMutation.isPending}
                      data-testid="button-message-seller"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {createConversationMutation.isPending ? "Starting conversation..." : "Message Seller"}
                    </Button>
                  )}

                  {isOwnListing && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground text-center">This is your listing</p>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/dashboard">View in Dashboard</Link>
                      </Button>
                    </div>
                  )}

                  {listing.status === "Sold" && !isOwnListing && (
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm font-medium">This textbook has been sold</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
