import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, BookOpen, DollarSign, MessageSquare, Shield, AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import calgaryBg from "@assets/Downtown_Calgary_2020-4_1764121653809.jpg";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error === "ucalgary_email_required") {
      setErrorMessage("This platform is exclusively for University of Calgary students. Please make sure you are using your UCalgary email address (@ucalgary.ca) to log in.");
      window.history.replaceState({}, "", "/");
    } else if (error === "session_expired") {
      setErrorMessage("Your login session expired. Please try logging in again.");
      window.history.replaceState({}, "", "/");
    } else if (error === "auth_failed") {
      setErrorMessage("Login failed. Please try again.");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setLocation("/browse");
    }
  };

  const popularCourses = ["CPSC", "ECON", "MATH", "CHEM", "ENGL", "BIOL"];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Error Alert */}
      {errorMessage && (
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <Alert variant="destructive" className="relative" data-testid="alert-error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
            <button
              onClick={() => setErrorMessage(null)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-destructive/20"
              data-testid="button-dismiss-error"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        </div>
      )}

      {/* Hero Section with Calgary Background */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${calgaryBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        
        <div className="relative mx-auto max-w-4xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-lg" data-testid="text-hero-title">
              Buy & Sell Textbooks at <span className="text-accent">UCalgary</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow">
              Save money on textbooks. Connect with fellow students. Buy and sell used textbooks safely on campus.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by course code (e.g., CPSC 457, ECON 201)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-12 text-base"
                  data-testid="input-search"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8" data-testid="button-search">
                Search
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-white/80">Popular:</span>
            {popularCourses.map((course) => (
              <Badge
                key={course}
                variant="secondary"
                className="cursor-pointer hover-elevate active-elevate-2 bg-white/20 text-white border-white/30 hover:bg-white/30"
                onClick={() => {
                  setSearchQuery(course);
                  setLocation(`/browse?search=${course}`);
                }}
                data-testid={`badge-course-${course.toLowerCase()}`}
              >
                {course}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why Use UCalgary Books?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg">Course-Specific</h3>
              <p className="text-sm text-muted-foreground">
                Search by course code to find exactly what you need for your classes
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg">Save Money</h3>
              <p className="text-sm text-muted-foreground">
                Get textbooks at a fraction of the bookstore price from fellow students
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg">Built-in Chat</h3>
              <p className="text-sm text-muted-foreground">
                Message sellers directly in the platform to arrange meetups
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg">Campus-Only</h3>
              <p className="text-sm text-muted-foreground">
                Safe transactions with verified UCalgary students
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground">
            Join the UCalgary textbook marketplace today. Log in with your UCalgary account to start buying and selling.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild data-testid="button-cta-login">
              <a href="/api/login">Log In to Browse</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-4 border-t">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          <p>UCalgary Textbook Marketplace &copy; {new Date().getFullYear()}</p>
          <p className="mt-1">A student-to-student platform for buying and selling textbooks</p>
        </div>
      </footer>
    </div>
  );
}
