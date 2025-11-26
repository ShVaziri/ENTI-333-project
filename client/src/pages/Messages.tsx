import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Message, User, Listing } from "@shared/schema";

type MessageWithUser = Message & { sender: User; receiver: User };
type ConversationData = {
  listing: Listing & { user: User };
  otherUser: User;
  messages: MessageWithUser[];
};

export default function Messages() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const { data: conversations, isLoading } = useQuery<Record<string, ConversationData>>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });

  const conversationsList = conversations ? Object.values(conversations) : [];
  const selectedConversation = selectedListingId && conversations ? conversations[selectedListingId] : null;

  useEffect(() => {
    if (conversationsList.length > 0 && !selectedListingId) {
      setSelectedListingId(conversationsList[0].listing.id);
    }
  }, [conversationsList, selectedListingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { listingId: string; content: string }) => {
      return await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setMessageInput("");
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
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedListingId) return;

    sendMessageMutation.mutate({
      listingId: selectedListingId,
      content: messageInput.trim(),
    });
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  const getUserName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "Unknown User";
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-8 px-4">
          <div className="mx-auto max-w-7xl">
            <Card className="h-[600px]">
              <div className="flex h-full">
                <div className="w-80 border-r p-4 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
                <div className="flex-1 p-4">
                  <Skeleton className="h-full w-full" />
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="mx-auto max-w-7xl">
          <Card className="h-[calc(100vh-12rem)] flex overflow-hidden">
            {/* Conversations List */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Messages</h2>
              </div>
              <ScrollArea className="flex-1">
                {conversationsList.length === 0 ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">No conversations yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Start a conversation by messaging a seller
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    {conversationsList.map((conv) => (
                      <button
                        key={conv.listing.id}
                        onClick={() => setSelectedListingId(conv.listing.id)}
                        className={`w-full p-3 rounded-lg text-left hover-elevate active-elevate-2 ${
                          selectedListingId === conv.listing.id ? "bg-muted" : ""
                        }`}
                        data-testid={`button-conversation-${conv.listing.id}`}
                      >
                        <div className="flex gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage
                              src={conv.otherUser.profileImageUrl || undefined}
                              alt={getUserName(conv.otherUser)}
                            />
                            <AvatarFallback>{getInitials(conv.otherUser)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium text-sm truncate">{getUserName(conv.otherUser)}</p>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mb-1">
                              {conv.listing.courseCode} - {conv.listing.title}
                            </p>
                            {conv.messages.length > 0 && (
                              <p className="text-xs text-muted-foreground truncate">
                                {conv.messages[conv.messages.length - 1].content}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={selectedConversation.otherUser.profileImageUrl || undefined}
                          alt={getUserName(selectedConversation.otherUser)}
                        />
                        <AvatarFallback>{getInitials(selectedConversation.otherUser)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold" data-testid="text-chat-user">
                          {getUserName(selectedConversation.otherUser)}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid="text-chat-listing">
                          {selectedConversation.listing.courseCode} - {selectedConversation.listing.title}
                        </p>
                      </div>
                      <Badge className="text-lg font-bold" data-testid="text-chat-price">
                        ${parseFloat(selectedConversation.listing.price).toFixed(2)}
                      </Badge>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {selectedConversation.messages.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        selectedConversation.messages.map((message) => {
                          const isOwnMessage = message.senderId === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                              data-testid={`message-${message.id}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                  isOwnMessage
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                                  }`}
                                >
                                  {new Date(message.sentAt!).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        disabled={sendMessageMutation.isPending}
                        data-testid="input-message"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!messageInput.trim() || sendMessageMutation.isPending}
                        data-testid="button-send"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                      <p className="text-muted-foreground">
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
