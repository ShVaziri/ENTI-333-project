import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Package } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Listing } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

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

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/my-listings"],
    enabled: isAuthenticated,
  });

  const markAsSoldMutation = useMutation({
    mutationFn: async (listingId: string) => {
      return await apiRequest("PATCH", `/api/listings/${listingId}`, {
        status: "Sold",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Success",
        description: "Listing marked as sold!",
      });
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
        description: "Failed to update listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: async (listingId: string) => {
      return await apiRequest("DELETE", `/api/listings/${listingId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Success",
        description: "Listing deleted successfully!",
      });
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
        description: "Failed to delete listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const activeListings = listings?.filter((l) => l.status === "Active") || [];
  const soldListings = listings?.filter((l) => l.status === "Sold") || [];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-8 px-4">
          <div className="mx-auto max-w-7xl space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Listings</h1>
            <Button asChild data-testid="button-post-new">
              <Link href="/post">
                <Plus className="h-4 w-4 mr-2" />
                Post New Listing
              </Link>
            </Button>
          </div>

          {/* Active Listings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Active Listings</h2>
              <span className="text-sm text-muted-foreground">
                {activeListings.length} active listing{activeListings.length !== 1 ? "s" : ""}
              </span>
            </div>

            {activeListings.length === 0 ? (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">No active listings</h3>
                    <p className="text-muted-foreground mb-4">
                      Post your first textbook to get started
                    </p>
                    <Button asChild>
                      <Link href="/post">Post Your First Listing</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeListings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden flex flex-col" data-testid={`card-active-${listing.id}`}>
                    <CardHeader className="p-0">
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="aspect-[3/4] w-full object-cover"
                        />
                      ) : (
                        <div className="aspect-[3/4] w-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">No image</span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 flex-1">
                      <Badge className="mb-2">{listing.courseCode}</Badge>
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2">{listing.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          ${parseFloat(listing.price).toFixed(2)}
                        </span>
                        <Badge variant="secondary">{listing.condition}</Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex-col gap-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => markAsSoldMutation.mutate(listing.id)}
                        disabled={markAsSoldMutation.isPending}
                        data-testid={`button-mark-sold-${listing.id}`}
                      >
                        Mark as Sold
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="w-full"
                            data-testid={`button-delete-${listing.id}`}
                          >
                            Delete Listing
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this listing? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteListingMutation.mutate(listing.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sold Listings */}
          {soldListings.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Sold Listings</h2>
                <span className="text-sm text-muted-foreground">
                  {soldListings.length} sold listing{soldListings.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {soldListings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden opacity-75" data-testid={`card-sold-${listing.id}`}>
                    <CardHeader className="p-0 relative">
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="aspect-[3/4] w-full object-cover"
                        />
                      ) : (
                        <div className="aspect-[3/4] w-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">No image</span>
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        SOLD
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Badge className="mb-2">{listing.courseCode}</Badge>
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2">{listing.title}</h3>
                      <span className="text-2xl font-bold text-muted-foreground">
                        ${parseFloat(listing.price).toFixed(2)}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
