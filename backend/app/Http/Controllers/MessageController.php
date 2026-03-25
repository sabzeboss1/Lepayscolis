<?php

namespace App\Http\Controllers;

use App\Http\Requests\Message\SendMessageRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MessageController extends Controller
{
    /**
     * Get user's conversations with other users.
     * 
     * GET /api/messages/conversations
     */
    public function conversations(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $conversations = Conversation::where('user1_id', $user->id)
            ->orWhere('user2_id', $user->id)
            ->with(['user1', 'user2', 'messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->get()
            ->sortByDesc(function ($conversation) {
                $lastMessage = $conversation->getLastMessage();
                return $lastMessage ? $lastMessage->created_at : $conversation->created_at;
            })
            ->values();

        return ConversationResource::collection($conversations);
    }

    /**
     * Get messages in a conversation.
     * 
     * GET /api/messages/{conversationId}
     */
    public function index(Request $request, string $conversationId): AnonymousResourceCollection
    {
        $user = $request->user();

        $conversation = Conversation::with(['user1', 'user2'])->findOrFail($conversationId);

        // Verify user is participant in conversation
        if ($conversation->user1_id !== $user->id && $conversation->user2_id !== $user->id) {
            abort(403, 'You are not authorized to view this conversation.');
        }

        $messages = Message::where('conversation_id', $conversationId)
            ->with(['sender', 'recipient'])
            ->orderBy('created_at', 'asc')
            ->paginate(50);

        return MessageResource::collection($messages);
    }

    /**
     * Send a message.
     * 
     * POST /api/messages
     */
    public function store(SendMessageRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Find or create conversation
        $conversation = $this->findOrCreateConversation(
            $user->id,
            $validated['recipient_id'],
            $validated['conversation_id'] ?? null
        );

        // Create message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'recipient_id' => $validated['recipient_id'],
            'content' => $validated['content'],
            'read' => false,
        ]);

        $message->load(['sender', 'recipient']);

        return response()->json([
            'message' => 'Message sent successfully.',
            'data' => new MessageResource($message),
        ], 201);
    }

    /**
     * Mark a message as read.
     * 
     * PATCH /api/messages/{messageId}/mark-read
     */
    public function markAsRead(Request $request, string $messageId): JsonResponse
    {
        $user = $request->user();

        $message = Message::with(['sender', 'recipient'])->findOrFail($messageId);

        // Verify user is the recipient
        if ($message->recipient_id !== $user->id) {
            abort(403, 'You are not authorized to mark this message as read.');
        }

        $message->update([
            'read' => true,
            'read_at' => now(),
        ]);

        return response()->json([
            'message' => 'Message marked as read.',
            'data' => new MessageResource($message),
        ]);
    }

    /**
     * Get total unread message count for user.
     * 
     * GET /api/messages/unread-count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        $count = Message::where('recipient_id', $user->id)
            ->where('read', false)
            ->count();

        return response()->json([
            'unread_count' => $count,
        ]);
    }

    /**
     * Get or create a conversation with a specific user.
     * 
     * GET /api/messages/conversation-with/{userId}
     */
    public function getOrCreateConversation(Request $request, string $userId): JsonResponse
    {
        $currentUser = $request->user();

        // Prevent user from creating conversation with themselves
        if ($currentUser->id == $userId) {
            return response()->json([
                'message' => 'You cannot create a conversation with yourself.',
            ], 400);
        }

        // Verify the other user exists
        $otherUser = \App\Models\User::findOrFail($userId);

        // Find or create conversation
        $conversation = $this->findOrCreateConversation($currentUser->id, $userId);
        
        $conversation->load(['user1', 'user2', 'messages' => function ($query) {
            $query->latest()->limit(1);
        }]);

        return response()->json([
            'data' => new ConversationResource($conversation),
        ]);
    }

    /**
     * Find or create a conversation between two users.
     */
    private function findOrCreateConversation(int $userId1, int $userId2, ?string $conversationId = null): Conversation
    {
        // If conversation_id provided, verify and return it
        if ($conversationId) {
            $conversation = Conversation::find($conversationId);
            if ($conversation) {
                return $conversation;
            }
        }

        // Ensure user1_id < user2_id for consistency
        $user1Id = min($userId1, $userId2);
        $user2Id = max($userId1, $userId2);

        // Find existing conversation
        $conversation = Conversation::where('user1_id', $user1Id)
            ->where('user2_id', $user2Id)
            ->first();

        // Create new conversation if not found
        if (!$conversation) {
            $conversation = Conversation::create([
                'user1_id' => $user1Id,
                'user2_id' => $user2Id,
            ]);
        }

        return $conversation;
    }
}
