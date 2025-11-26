import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import type { Listing, User } from "@shared/schema";

type ListingWithUser = Listing & { user: User };

export default function Home() {
  const searchParams = new URLSearchParams(useSearch());
  const initialSearch = searchParams.get("search") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [, setLocation] = useLocation();

  const { data: listings, isLoading } = useQuery<ListingWithUser[]>({
    queryKey: ["/api/listings"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled client-side for now
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPriceFilter("all");
    setConditionFilter("all");
  };

  // Filter listings
  const filteredListings = listings?.filter((listing) => {
    const matchesSearch =
      !searchQuery ||
      listing.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.author?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCondition = conditionFilter === "all" || listing.condition === conditionFilter;

    let matchesPrice = true;
    if (priceFilter === "under25") {
      matchesPrice = parseFloat(listing.price) < 25;
    } else if (priceFilter === "25to50") {
      matchesPrice = parseFloat(listing.price) >= 25 && parseFloat(listing.price) <= 50;
    } else if (priceFilter === "50to100") {
      matchesPrice = parseFloat(listing.price) > 50 && parseFloat(listing.price) <= 100;
    } else if (priceFilter === "over100") {
      matchesPrice = parseFloat(listing.price) > 100;
    }

    return matchesSearch && matchesCondition && matchesPrice && listing.status === "Active";
  });

  const hasActiveFilters = searchQuery || priceFilter !== "all" || conditionFilter !== "all";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Search and Filters */}
          <div className="space-y-4">
            <form onSubmit={handleSearch}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by course code, title, or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-listings"
                  />
                </div>
              </div>
            </form>

            <div className="flex flex-wrap gap-4 items-center">
              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger className="w-40" data-testid="select-condition">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Like New">Like New</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-40" data-testid="select-price">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under25">Under $25</SelectItem>
                  <SelectItem value="25to50">$25 - $50</SelectItem>
                  <SelectItem value="50to100">$50 - $100</SelectItem>
                  <SelectItem value="over100">Over $100</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}

              <div className="ml-auto text-sm text-muted-foreground">
                {filteredListings?.length || 0} textbook{filteredListings?.length !== 1 ? "s" : ""} available
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="p-0">
                    <Skeleton className="aspect-[3/4] w-full rounded-t-lg" />
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredListings && filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map((listing) => (
                <Link key={listing.id} href={`/listing/${listing.id}`}>
                  <Card className="overflow-hidden hover-elevate cursor-pointer h-full flex flex-col" data-testid={`card-listing-${listing.id}`}>
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
                      <Badge className="absolute top-2 right-2" data-testid={`badge-course-${listing.id}`}>
                        {listing.courseCode}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2" data-testid={`text-title-${listing.id}`}>
                        {listing.title}
                      </h3>
                      {listing.author && (
                        <p className="text-sm text-muted-foreground mb-3">{listing.author}</p>
                      )}
                      <div className="mt-auto space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary" data-testid={`text-price-${listing.id}`}>
                            ${parseFloat(listing.price).toFixed(2)}
                          </span>
                          <Badge variant="secondary" data-testid={`badge-condition-${listing.id}`}>
                            {listing.condition}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button className="w-full" variant="outline" data-testid={`button-view-${listing.id}`}>
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No textbooks found</h3>
                  <p className="text-muted-foreground">
                    {hasActiveFilters
                      ? "Try adjusting your filters to see more results"
                      : "Be the first to post a textbook for sale!"}
                  </p>
                </div>
                {!hasActiveFilters && (
                  <Button asChild>
                    <Link href="/post">Post Your First Listing</Link>
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
