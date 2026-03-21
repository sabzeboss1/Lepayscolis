<?php

namespace App\Services\Admin;

use App\Models\AuditLog;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminMessagingService
{
    public function getConversations(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = Conversation::with(['user1', 'user2', 'messages' => fn($q) => $q->latest('created_at')->limit(1)])
            ->withCount('messages');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('user1', fn($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('user2', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        return $query->latest('updated_at')->paginate($perPage);
    }

    public function getConversationMessages(string $conversationId): array
    {
        $conversation = Conversation::with(['user1', 'user2'])->findOrFail($conversationId);
        $messages = Message::where('conversation_id', $conversationId)
            ->with('sender')
            ->oldest('created_at')
            ->get();

        return [
            'conversation' => $conversation,
            'messages' => $messages,
        ];
    }

    public function banUserFromMessaging(int $userId, string $reason, User $admin): User
    {
        $user = User::findOrFail($userId);

        $before = ['messaging_banned' => false];

        $user->update([
            'messaging_banned' => true,
            'messaging_ban_reason' => $reason,
        ]);

        $after = ['messaging_banned' => true, 'reason' => $reason];

        AuditLog::log($admin, 'ban_messaging', 'user', $userId, $before, $after);

        return $user->fresh();
    }

    public function unbanUserFromMessaging(int $userId, User $admin): User
    {
        $user = User::findOrFail($userId);

        $before = ['messaging_banned' => true];

        $user->update([
            'messaging_banned' => false,
            'messaging_ban_reason' => null,
        ]);

        $after = ['messaging_banned' => false];

        AuditLog::log($admin, 'unban_messaging', 'user', $userId, $before, $after);

        return $user->fresh();
    }

    public function deleteMessage(string $messageId, string $reason, User $admin): void
    {
        $message = Message::findOrFail($messageId);

        $before = ['content' => $message->content];

        $message->delete();

        $after = ['deleted' => true, 'reason' => $reason];

        AuditLog::log($admin, 'delete', 'message', $messageId, $before, $after);
    }
}
